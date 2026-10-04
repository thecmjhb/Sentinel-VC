import { Bot } from 'grammy';
import { loadConfig } from './config.js';
import { Store } from './store.js';
import { SecurityEngine, isPresent, isAdmin } from './securityEngine.js';
import { PROJECT, projectButtons, configureCommandMenus } from './botPresentation.js';
import { createHttpServer } from './httpServer.js';
import { SerialQueue, log, logError } from './runtime.js';
import { pathToFileURL } from 'node:url';
import { installOnboarding } from './onboarding.js';
import { installDashboard } from './dashboard.js';
import { installRecovery } from './recovery.js';
import { installVoiceAccounts } from './voiceAccounts.js';

export function createApplication(config, dependencies = {}) {
  const store = dependencies.store || new Store(config.dataDir);
  const bot = dependencies.bot || new Bot(config.token, { client: { timeoutSeconds: 10 } });
  const engine = new SecurityEngine({ config, store, api: bot.api, budget: dependencies.budget });
  const queue = new SerialQueue();
  const status = { ready: false };
  const server = createHttpServer(config, status);
  const reply = (ctx, text, options) => engine.reply(ctx.chat.id, text, options);

  // Both update transports share this queue, preventing per-user restore/gate races.
  bot.use((ctx, next) => queue.run(async () => {
    if (store.seen(ctx.update.update_id)) return;
    // Ignore historical moderation triggers; do not replay hours-old joins after downtime.
    const dated = ctx.message || ctx.chatMember || ctx.myChatMember;
    if (dated?.date && dated.date * 1000 < Date.now() - 120000) { store.mark(ctx.update.update_id); return; }
    await next();
    store.mark(ctx.update.update_id);
  }));
  // Flood controls include commands. A command cannot bypass accounting by being consumed.
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type !== 'supergroup') return next();
    if (ctx.message?.from && !ctx.message.sender_chat && !ctx.message.new_chat_members &&
      !ctx.message.left_chat_member && !ctx.message.video_chat_started && !ctx.message.video_chat_ended &&
      !ctx.message.video_chat_scheduled && !ctx.message.video_chat_participants_invited) {
      await engine.process({ chatId: ctx.chat.id, userId: ctx.from.id, username: ctx.from.username ?? '',
        isBot: ctx.from.is_bot, kind: 'message' });
    }
    if (ctx.callbackQuery?.from) await engine.process({ chatId: ctx.chat.id, userId: ctx.from.id,
      username: ctx.from.username ?? '', isBot: ctx.from.is_bot, kind: 'callback' });
    return next();
  });
  bot.on('chat_member', async ctx => {
    const update = ctx.chatMember;
    if (ctx.chat.type !== 'supergroup') return;
    const before = isPresent(update.old_chat_member), after = isPresent(update.new_chat_member);
    if (before === after) return;
    const user = update.new_chat_member.user;
    await engine.process({ chatId: ctx.chat.id, userId: user.id, username: user.username ?? '',
      isBot: user.is_bot, kind: after ? 'join' : 'leave' });
  });
  bot.on('my_chat_member', async ctx => {
    if (!['supergroup', 'channel'].includes(ctx.chat.type)) return;
    if (!isAdmin(ctx.myChatMember.new_chat_member)) {
      store.deleteGroup(ctx.chat.id); store.forgetCommunity(ctx.chat.id);
      engine.vc?.dropChat(ctx.chat.id); engine.vc?.requestRefresh(); return;
    }
    const actor = ctx.myChatMember.from;
    try {
      if (actor && !actor.is_bot && await engine.administrator(ctx.chat.id, actor.id))
        store.rememberCommunity(ctx.chat, actor.id, config.maxGroups);
    } catch (error) { logError('community_discovery_failed', error); }
  });
  bot.on('message', (ctx, next) => {
    if (!store.group(ctx.chat.id)) return next();
    for (const kind of ['video_chat_started', 'video_chat_ended', 'video_chat_scheduled', 'video_chat_participants_invited']) {
      if (ctx.message[kind]) {
        store.audit(ctx.chat.id, null, 'vc-service', { kind });
        engine.vc?.requestRefresh();
      }
    }
    return next();
  });
  // No command response or access-gate prompt is ever posted in a community.
  bot.use((ctx, next) => ctx.chat?.type === 'private' && ctx.from && ctx.chat.id === ctx.from.id ? next() : undefined);
  installRecovery({ bot, store, engine });
  installVoiceAccounts({ bot, engine });
  dependencies.installAccess?.({ bot, store, engine });
  const dashboard = installDashboard({ bot, store, engine, config });
  installOnboarding({ bot, store, engine, dashboard });
  bot.command('updates', ctx => reply(ctx, `Sentinel-VC project\nUpdates: ${PROJECT.updates}\nSource: ${PROJECT.source}\n` +
    'The channel is optional for self-hosted deployments.',
    { reply_markup: projectButtons(bot.botInfo.username, ctx.from?.language_code === 'bn'), link_preview_options: { is_disabled: true } }));
  bot.command('privacy', ctx => reply(ctx, 'This operator stores community IDs/titles, administrator links, language preferences, temporary challenges and moderation audit events. ' +
    `Audit retention: ${config.retentionDays} days. Administrator links expire after one year without reconfirmation. ` +
    'No message content, audio or UDP packets are persisted. All bot messages are private.\n' +
    'Optional QR user sessions and community bindings are encrypted on this VPS until disconnected. Sessions grant account access to this operator. /disconnectvoice detaches your QR account; check Telegram Devices for revocation. No OTP/password is collected in bot messages.\n' +
    `${PROJECT.source}/blob/main/PRIVACY.md`, { link_preview_options: { is_disabled: true } }));
  bot.catch(error => logError('update_failed', error.error));

  return { config, store, bot, engine, queue, status, server };
}

export async function main(dependencies = {}) {
  let config;
  try { config = loadConfig(); }
  catch (error) { console.error(`Configuration: ${error.message}`); throw error; }
  const { store, bot, engine, queue, status, server } = createApplication(config, dependencies);

  let sweep;
  let stopping = false;
  let stopRequest;
  function requestStop() {
    stopping = true; status.ready = false;
    clearInterval(sweep); queue.close();
    if (engine.vc) engine.vc.stopped = true;
    if (bot.isRunning() && !stopRequest) stopRequest = bot.stop().catch(error => logError('poll_stop_failed', error));
  }
  async function shutdown() {
    requestStop();
    if (stopRequest) await stopRequest;
    await queue.drain();
    await engine.vc?.stop();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    store.close();
  }
  process.once('SIGINT', requestStop);
  process.once('SIGTERM', requestStop);
  try {
    await bot.init();
    await dependencies.preflight?.(bot.api, bot.botInfo);
    if (stopping) return;
    const webhook = await bot.api.getWebhookInfo();
    if (stopping) return;
    if (webhook.url) throw new Error('Existing webhook detected. Remove it deliberately before starting this polling instance.');
    try { await configureCommandMenus(bot.api); }
    catch (error) { logError('command_menu_failed', error); }
    if (stopping) return;
    if (config.mtEnabled || config.mtQrEnabled) {
      const { VoiceAccounts } = await import('./voiceAccounts.js');
      engine.vc = new VoiceAccounts({ config, store, engine, queue, api: bot.api, selfId: bot.botInfo.id });
      await engine.vc.start();
      if (stopping) return;
    }
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.httpPort, config.httpHost, resolve); });
    if (stopping) return;
    sweep = setInterval(() => queue.run(() => { engine.flood.sweep(); store.prune(config.retentionDays); })
      .catch(error => logError('maintenance_failed', error)), 60000);
    sweep.unref();
    log('started', { bot: bot.botInfo.username, mode: config.mode, vcAdapter: config.mtEnabled, vcQr: config.mtQrEnabled });
    // Poll timeout must be shorter than the Bot API client's 10-second deadline.
    await bot.start({ timeout: 5, allowed_updates: ['message', 'chat_member', 'my_chat_member', 'callback_query'],
      onStart: () => { status.ready = true; } });
  } finally { await shutdown(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { logError('startup_failed', error); process.exitCode = 1; });
}
