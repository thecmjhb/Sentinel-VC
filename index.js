import { Bot } from 'grammy';
import { loadConfig } from './config.js';
import { Store } from './store.js';
import { SecurityEngine, isPresent, isAdmin } from './securityEngine.js';
import { PROJECT, projectButtons, configureCommandMenus } from './botPresentation.js';
import { createHttpServer } from './httpServer.js';
import { SerialQueue, log, logError } from './runtime.js';
import { pathToFileURL } from 'node:url';

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
  const admin = async ctx => {
    if (ctx.chat?.type !== 'supergroup' || !ctx.from || ctx.message?.sender_chat) return false;
    // Durable user + chat limits protect expensive fresh permission checks.
    if (!store.claim(`command:${ctx.chat.id}:${ctx.from.id}`, 2000)) return false;
    return engine.administrator(ctx.chat.id, ctx.from.id);
  };
  bot.command('start', ctx => {
    const bangla = ctx.from?.language_code === 'bn';
    return reply(ctx, bangla ?
      'Sentinel-VC-তে স্বাগতম।\n১. নিজের supergroup-এ bot-কে admin করুন; Restrict Members দিন।\n' +
      '২. গ্রুপে /setup দিন, তারপর /doctor দিয়ে পরীক্ষা করুন।\n৩. প্রথমে observe mode-এ ব্যবহার করুন; প্রস্তুত হলে /mode enforce দিন।\n' +
      'সরাসরি VC features-এর জন্য optional user-admin adapter লাগে। /help-এ কমান্ড পাবেন।' :
      'Welcome to Sentinel-VC.\n1. Add this bot to your supergroup as an admin with Restrict Members.\n' +
      '2. Send /setup in the group, then /doctor to check it.\n3. Begin in observe mode; use /mode enforce when ready.\n' +
      'Direct VC features need the optional user-admin adapter. Use /help for commands.',
    { reply_markup: projectButtons(bot.botInfo.username, bangla), link_preview_options: { is_disabled: true } });
  });
  bot.command('help', ctx => reply(ctx, '/setup · /doctor · /status · /incidents · /mode observe|enforce · /gate on|off · /vc on|off · /vclock on|off · /verify · /updates · /privacy · /disable\n' +
    'Admins configure protection. /verify reopens your chat challenge. In a private chat, append the group ID from the challenge. Account age and UDP are unavailable.'));
  bot.command('updates', ctx => reply(ctx, `Sentinel-VC project\nUpdates: ${PROJECT.updates}\nSource: ${PROJECT.source}\n` +
    'The channel is optional; no channel membership is required for verification.',
    { reply_markup: projectButtons(bot.botInfo.username, ctx.from?.language_code === 'bn'), link_preview_options: { is_disabled: true } }));
  bot.command('privacy', ctx => reply(ctx, 'This operator stores group/user IDs, moderation timestamps, event classes, ' +
    `challenge state and optional call identifiers. Audit retention: ${config.retentionDays} days, pruned while running. ` +
    'Settings stay until removal; backups are controlled by the operator. The moderation database stores no message text, audio or UDP packets.\n' +
    `${PROJECT.source}/blob/main/PRIVACY.md`, { link_preview_options: { is_disabled: true } }));
  bot.command('setup', async ctx => {
    if (ctx.chat?.type !== 'supergroup' || !ctx.from || ctx.message?.sender_chat) {
      await reply(ctx, 'Run /setup from your human administrator account inside a supergroup. Use /start to add the bot.'); return;
    }
    if (!store.claim(`command:${ctx.chat.id}:${ctx.from.id}`, 2000)) return;
    try {
      if (!await engine.enroll(ctx.chat.id, ctx.from.id, bot.botInfo.id)) {
        await reply(ctx, 'A current group administrator must run /setup.'); return;
      }
    } catch (error) {
      if (error.message === 'Bot needs administrator and restrict-members rights') {
        await reply(ctx, 'Give the bot administrator status and Restrict Members, then run /setup again.'); return;
      }
      if (error.message === 'Group capacity exceeded') {
        await reply(ctx, 'This operator has reached the configured group limit. Contact the operator or self-host.'); return;
      }
      throw error;
    }
    await reply(ctx, `Protection enrolled in ${store.group(ctx.chat.id).mode} mode. Run /mode enforce to enable actions; /gate on enables the join challenge. /status shows capabilities.`);
  });
  bot.command('status', async ctx => {
    if (!await admin(ctx)) return;
    const group = store.group(ctx.chat.id);
    await reply(ctx, `Chat ID: ${ctx.chat.id}\n${group ? `Mode: ${group.mode}; join gate: ${group.gate}; VC opt-in: ${group.vc}; join-muted on detection: ${group.vcLock}` : 'Run /setup first.'}\n` +
      `VC adapter: ${engine.vc?.capability(ctx.chat.id) || 'disabled'}\nUDP counters and account creation dates: unavailable.`);
  });
  bot.command('doctor', async ctx => {
    if (!await admin(ctx)) return;
    const self = await engine.call('getChatMember', ctx.chat.id, ctx.chat.id, bot.botInfo.id);
    const group = store.group(ctx.chat.id);
    await reply(ctx, `Setup check for ${ctx.chat.title || 'this supergroup'}\nChat ID: ${ctx.chat.id}\n` +
      `Bot administrator: ${isAdmin(self) ? 'yes' : 'NO - promote the bot'}\n` +
      `Restrict Members: ${self.can_restrict_members ? 'yes' : 'NO - grant this permission'}\n` +
      `Enrollment: ${group ? 'yes' : 'NO - run /setup'}\n` +
      `Mode: ${group?.mode || 'not enrolled'}\nJoin gate: ${group?.gate ? 'on' : 'off'}\n` +
      `Voice adapter: ${engine.vc?.capability(ctx.chat.id) || 'disabled; optional setup required'}\n` +
      'Wait a few seconds between commands. UDP monitoring and account creation dates are unavailable.');
  });
  bot.command('incidents', async ctx => {
    if (!await admin(ctx)) return;
    if (!store.group(ctx.chat.id)) { await reply(ctx, 'Run /setup first.'); return; }
    const rows = store.incidents(ctx.chat.id, 10);
    await reply(ctx, rows.length ? 'Latest retained incidents (UTC):\n' + rows.map(row =>
      `${new Date(row.at).toISOString()} | ${row.action} | user ${row.user_id || 'call policy'}`).join('\n') +
      '\nA detection is a policy flag, not proof of a UDP attack.' : 'No retained incidents for this group.');
  });
  for (const command of ['mode', 'gate', 'vc', 'vclock']) {
    bot.command(command, async ctx => {
      if (!await admin(ctx)) return;
      const group = store.group(ctx.chat.id);
      if (!group) { await reply(ctx, 'Run /setup first.'); return; }
      const value = ctx.match.trim().toLowerCase();
      const options = command === 'mode' ? ['observe', 'enforce'] : ['on', 'off'];
      if (!options.includes(value)) { await reply(ctx, `Use /${command} ${options.join('|')}`); return; }
      if (command === 'vc' && value === 'on' && (!engine.vc || !config.mtAllowedChats.has(String(ctx.chat.id)))) {
        await reply(ctx, 'The operator must configure the MTProto adapter and allowlist this chat first.'); return;
      }
      group[command === 'vclock' ? 'vcLock' : command] = command === 'mode' ? value : value === 'on';
      store.setGroup(ctx.chat.id, group);
      store.audit(ctx.chat.id, ctx.from.id, 'configure', { command, value });
      await reply(ctx, `${command}: ${value}. ${command === 'vclock' ? 'This changes future incident policy; existing call settings require manual admin restoration.' : ''}`);
      if (command === 'vc') engine.vc?.requestRefresh();
    });
  }
  bot.command('disable', async ctx => {
    if (!await admin(ctx)) return;
    store.deleteGroup(ctx.chat.id);
    await reply(ctx, 'Protection disabled. Temporary chat restrictions expire naturally. Review any live-call mutes and join-muted settings manually.');
    engine.vc?.requestRefresh();
  });
  bot.command('verify', async ctx => {
    if (!ctx.from || ctx.message?.sender_chat) return;
    const chatId = ctx.chat.type === 'private' ? Number(ctx.match.trim()) : ctx.chat.id;
    if (!Number.isSafeInteger(chatId) || chatId >= 0 || !store.group(chatId)) {
      await reply(ctx, 'In a private chat use /verify followed by your supergroup ID, shown in the challenge.'); return;
    }
    if (!store.claim(`verify:${chatId}:${ctx.from.id}`, 10000)) return;
    if (!await engine.showGate(chatId, ctx.from.id, store.gate(chatId, ctx.from.id), ctx.chat.id))
      await reply(ctx, 'No active chat challenge. Contact an administrator for live-call unmuting.');
  });
  bot.callbackQuery(/^sv:(-\d+):([a-f0-9]{24}):(-?\d+)$/, async ctx => {
    const chatId = Number(ctx.match[1]);
    if (!ctx.chat || !Number.isSafeInteger(chatId) || !store.group(chatId) ||
      (ctx.chat.type !== 'private' && ctx.chat.id !== chatId)) return;
    if (!store.claim(`answer:${chatId}:${ctx.from.id}`, 1000)) return;
    const result = await engine.verify(chatId, ctx.from.id, ctx.match[2], ctx.match[3]);
    await engine.call('answerCallbackQuery', chatId, ctx.callbackQuery.id, { text: result });
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
  bot.on('my_chat_member', ctx => {
    if (!isPresent(ctx.myChatMember.new_chat_member)) { store.deleteGroup(ctx.chat.id); engine.vc?.requestRefresh(); }
  });
  bot.on('message', ctx => {
    if (!store.group(ctx.chat.id)) return;
    for (const kind of ['video_chat_started', 'video_chat_ended', 'video_chat_scheduled', 'video_chat_participants_invited']) {
      if (ctx.message[kind]) {
        store.audit(ctx.chat.id, null, 'vc-service', { kind });
        engine.vc?.requestRefresh();
      }
    }
  });
  bot.catch(error => logError('update_failed', error.error));

  return { config, store, bot, engine, queue, status, server };
}

export async function main() {
  let config;
  try { config = loadConfig(); }
  catch (error) { console.error(`Configuration: ${error.message}`); throw error; }
  const { store, bot, engine, queue, status, server } = createApplication(config);

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
    if (stopping) return;
    const webhook = await bot.api.getWebhookInfo();
    if (stopping) return;
    if (webhook.url) throw new Error('Existing webhook detected. Remove it deliberately before starting this polling instance.');
    try { await configureCommandMenus(bot.api); }
    catch (error) { logError('command_menu_failed', error); }
    if (stopping) return;
    if (config.mtEnabled) {
      const { VoiceAdapter } = await import('./voiceAdapter.js');
      engine.vc = new VoiceAdapter({ config, store, engine, queue });
      await engine.vc.start();
      if (stopping) return;
    }
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.httpPort, config.httpHost, resolve); });
    if (stopping) return;
    sweep = setInterval(() => queue.run(() => { engine.flood.sweep(); store.prune(config.retentionDays); })
      .catch(error => logError('maintenance_failed', error)), 60000);
    sweep.unref();
    log('started', { bot: bot.botInfo.username, mode: config.mode, vcAdapter: config.mtEnabled });
    // Poll timeout must be shorter than the Bot API client's 10-second deadline.
    await bot.start({ timeout: 5, allowed_updates: ['message', 'chat_member', 'my_chat_member', 'callback_query'],
      onStart: () => { status.ready = true; } });
  } finally { await shutdown(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { logError('startup_failed', error); process.exitCode = 1; });
}
