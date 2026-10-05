import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink, readdir } from 'node:fs/promises';
import path from 'node:path';
import { TelegramClient, Api } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { InputFile } from 'grammy';
import QRCode from 'qrcode';
import { VoiceAdapter } from './voiceAdapter.js';
import { logError } from './runtime.js';

const userId = value => {
  if (!Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new Error('Invalid account owner');
  return String(Number(value));
};
const chatId = value => {
  if (!/^-100\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new Error('Invalid community');
  return String(value);
};

// AAD binds every encrypted record to its bot-chat owner. Keys never enter SQLite/audits.
export class SessionVault {
  constructor(directory, key) {
    if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('Invalid session encryption key');
    this.directory = directory; this.key = Buffer.from(key, 'hex');
  }
  file(owner) { return path.join(this.directory, `${userId(owner)}.json`); }
  async owners(limit) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const files = await readdir(this.directory);
    const owners = files.filter(x => /^[1-9]\d*\.json$/.test(x)).map(x => x.slice(0, -5));
    if (owners.length > limit) throw new Error('Saved voice accounts exceed configured capacity');
    return owners;
  }
  async read(owner) {
    const id = userId(owner), bytes = await readFile(this.file(id));
    if (bytes.length > 1024 * 1024) throw new Error('Oversized voice account record');
    const record = JSON.parse(bytes);
    if (record.version !== 1) throw new Error('Unsupported session record');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(record.iv, 'hex'));
    decipher.setAAD(Buffer.from(`Sentinel-VC:voice:${id}:v1`));
    decipher.setAuthTag(Buffer.from(record.tag, 'hex'));
    const data = JSON.parse(Buffer.concat([decipher.update(Buffer.from(record.data, 'base64')), decipher.final()]));
    if (String(data.owner) !== id || typeof data.session !== 'string' || !data.session || !Array.isArray(data.chats) || data.chats.length > 10000)
      throw new Error('Invalid voice account record');
    data.chats = [...new Set(data.chats.map(chatId))];
    return data;
  }
  async save(owner, session, chats) {
    const id = userId(owner), iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(`Sentinel-VC:voice:${id}:v1`));
    const data = Buffer.concat([cipher.update(JSON.stringify({ owner: id, session, chats: [...chats].map(chatId) })), cipher.final()]);
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temp = path.join(this.directory, `.account-${randomBytes(12).toString('hex')}.tmp`);
    try {
      await writeFile(temp, JSON.stringify({ version: 1, iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('base64') }), { mode: 0o600, flag: 'wx' });
      await rename(temp, this.file(id));
    } finally { await unlink(temp).catch(() => {}); }
  }
  async remove(owner) { await unlink(this.file(owner)).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

export class VoiceAccounts {
  constructor({ config, store, engine, queue, api, selfId, clientFactory, adapterFactory, vault }) {
    Object.assign(this, { config, store, engine, queue, api, selfId });
    this.adapters = new Map(); this.bindings = new Map(); this.pending = new Map(); this.jobs = new Set();
    this.passwordPrompts = new Map();
    this.legacy = null; this.stopped = false;
    this.vault = vault || (config.mtQrEnabled ? new SessionVault(path.join(config.dataDir, 'voice-accounts'), config.mtSessionKey) : null);
    this.clientFactory = clientFactory || (session => {
      const client = new TelegramClient(new StringSession(session), config.mtApiId, config.mtApiHash,
        { connectionRetries: 2, reconnectRetries: 2, requestRetries: 1, floodSleepThreshold: 0, timeout: 10,
          deviceModel: 'Sentinel-VC voice controls', appVersion: '0.1.0' });
      client.setLogLevel('none'); return client;
    });
    this.adapterFactory = adapterFactory || (options => new VoiceAdapter(options));
  }
  adapter(id) { return this.adapters.get(this.bindings.get(String(id)))?.adapter || (this.config.mtAllowedChats.has(String(id)) ? this.legacy : null); }
  allows(id) { return Boolean(this.adapter(id)); }
  entry(id) { return this.adapter(id)?.entry(id); }
  capability(id) { return this.adapter(id)?.capability(id) || 'connect an administrator account'; }
  dropChat(id) { this.adapter(id)?.dropChat(id); }
  requestRefresh() { this.legacy?.requestRefresh(); for (const { adapter } of this.adapters.values()) adapter.requestRefresh(); }
  async authorized(owner, id) {
    if (!await this.engine.administrator(Number(id), Number(owner)) || !await this.engine.administrator(Number(id), this.selfId))
      throw new Error('Both account owner and bot must be current community administrators');
  }
  async routed(id) {
    const adapter = this.adapter(id);
    if (!adapter) throw new Error('No connected voice account for this community');
    const owner = this.bindings.get(String(id));
    if (owner) await this.authorized(owner, id);
    return adapter;
  }
  async setAdmission(...args) { return (await this.routed(args[0])).setAdmission(...args); }
  async endCall(...args) { return (await this.routed(args[0])).endCall(...args); }
  async mitigate(...args) {
    try { return await (await this.routed(args[0])).mitigate(...args); }
    catch (error) { logError('vc_account_action_unavailable', error); return false; }
  }
  async start() {
    if (this.config.mtEnabled) {
      this.legacy = this.adapterFactory({ config: this.config, store: this.store, engine: this.engine, queue: this.queue });
      await this.legacy.start();
    }
    if (!this.vault) return;
    // Refuse to proceed with a wrong key/corrupt ciphertext; never silently overwrite saved sessions.
    const records = await Promise.all((await this.vault.owners(this.config.mtMaxAccounts)).map(owner => this.vault.read(owner)));
    for (const record of records) {
      const client = this.clientFactory(record.session);
      try {
        await client.connect();
        if (!await client.checkAuthorization()) throw new Error('Session revoked');
        const me = await client.getMe();
        if (me.bot || String(me.id) !== record.owner) throw new Error('Account owner mismatch');
        const chats = new Set();
        for (const id of record.chats) {
          if (this.legacy && this.config.mtAllowedChats.has(id)) continue;
          try { await this.authorized(record.owner, id); chats.add(id); }
          catch { /* Revocation must not reattach a previous community. */ }
        }
        await this.attach(record.owner, client, chats);
      } catch (error) { await client.disconnect().catch(() => {}); logError('vc_account_restore_failed', error); }
    }
  }
  async attach(owner, client, chats) {
    const id = userId(owner);
    for (const chat of chats) if (this.bindings.has(chat) && this.bindings.get(chat) !== id) throw new Error('Community already bound');
    const allowed = new Set(chats);
    // Per-account allowlists never mutate the legacy operator allowlist.
    const boundedStore = Object.create(this.store);
    boundedStore.groups = () => this.store.groups().filter(group => allowed.has(group.id));
    const accountEngine = Object.create(this.engine);
    accountEngine.process = async event => { await this.authorized(id, event.chatId); return this.engine.process(event); };
    const adapter = this.adapterFactory({ config: { ...this.config, mtAllowedChats: allowed }, store: boundedStore,
      engine: accountEngine, queue: this.queue, client });
    // Automatic policy actions also recheck the session owner and the bot, before any call RPC.
    const rights = adapter.rights.bind(adapter);
    adapter.rights = async chat => { await this.authorized(id, chat); return rights(chat); };
    await adapter.start();
    this.adapters.set(id, { adapter, allowed });
    for (const chat of allowed) this.bindings.set(chat, id);
  }
  async connect(owner, community, bn = false) {
    const id = userId(owner), target = chatId(community);
    if (!this.config.mtQrEnabled || !this.vault) throw new Error('Operator must enable QR account connection first');
    if (this.stopped) return;
    await this.authorized(id, target);
    if (this.config.mtAllowedChats.has(target) && this.legacy) throw new Error('This community uses the operator account already');
    if (this.bindings.has(target) && this.bindings.get(target) !== id) throw new Error('Disconnect the existing account binding first');
    const existing = this.adapters.get(id);
    if (existing) {
      existing.allowed.add(target);
      try {
        if (!await existing.adapter.rights(target)) throw new Error('Manage call permission required');
        await this.vault.save(id, existing.adapter.client.session.save(), existing.allowed);
        this.bindings.set(target, id); existing.adapter.requestRefresh();
        await this.engine.reply(Number(id), bn ? 'নিজের account এই community-তে যুক্ত হয়েছে। এখন ভয়েস নিয়ন্ত্রণ চালু করুন।' : 'Your account is connected to this community. Enable Voice controls in the panel.');
      } catch (error) { if (!this.bindings.has(target)) existing.allowed.delete(target); throw error; }
      return;
    }
    if (this.pending.has(id)) throw new Error('Account connection is already pending; cancel or finish it first');
    const savedOwners=await this.vault.owners(this.config.mtMaxAccounts);
    if (this.pending.size >= 5 || (!savedOwners.includes(id) && savedOwners.length + this.pending.size >= this.config.mtMaxAccounts))
      throw new Error('Voice account capacity reached');
    if (!this.store.claim(`vc-account-connect:${id}`, 60000)) throw new Error('Wait one minute before another connection attempt');
    const controller = new AbortController(), client = this.clientFactory('');
    const pending = { client, controller, message: null }; this.pending.set(id, pending);
    // Login waits outside the application queue. Only validated attachment enters that queue.
    const job = this.login(id, target, pending, bn);
    this.jobs.add(job); void job.finally(() => this.jobs.delete(job)).catch(error=>logError('vc_login_cleanup_failed',error));
  }
  async removeQr(id, pending) {
    const message = pending.message; pending.message = null;
    if (message) await this.api.deleteMessage(Number(id), message).catch(() => {});
  }
  async deletePrivateMessage(id, message) {
    if (!message) return;
    try { await this.api.deleteMessage(Number(id), message); }
    catch (error) { logError('vc_secret_message_delete_failed', error); }
  }
  async askPassword(id, pending, bn) {
    if (pending.controller.signal.aborted || this.stopped) throw new Error('Connection cancelled');
    pending.needsPassword = true;
    pending.passwordAttempts = (pending.passwordAttempts || 0) + 1;
    if (pending.passwordAttempts > 3) throw new Error('Password attempts exhausted');
    await this.removeQr(id, pending);
    for (const [key, until] of this.passwordPrompts) if (until <= Date.now()) this.passwordPrompts.delete(key);
    const request = { message: null, resolve: null, reject: null };
    const promise = new Promise((resolve, reject) => { request.resolve = resolve; request.reject = reject; });
    // An abort can arrive while the Telegram prompt RPC is still in flight.
    void promise.catch(() => {});
    const abort = () => request.reject(new Error('Connection cancelled'));
    pending.passwordRequest = request;
    pending.controller.signal.addEventListener('abort', abort, { once: true });
    try {
      const notice = bn ?
        `${pending.passwordAttempts > 1 ? 'আগের 2FA password সঠিক হয়নি। ' : ''}Telegram 2FA password প্রয়োজন। এই message-এর Reply দিয়ে নিজের স্থায়ী 2FA password পাঠান। OTP/login code নয়। Password message পাওয়ার পর মুছতে চেষ্টা করা হবে; database/log-এ রাখা হবে না। Bot chat-এর Telegram কপি বা screenshot পুরোপুরি মুছে যাওয়ার নিশ্চয়তা নেই। VPS operator password/session access পেতে পারে। 2FA বন্ধ করবেন না। চেষ্টা ${pending.passwordAttempts}/3। বাতিল: /cancelvoice` :
        `${pending.passwordAttempts > 1 ? 'The previous 2FA password was incorrect. ' : ''}Telegram requires your two-step verification PASSWORD. Reply to THIS message with your own password, not an OTP/login code. We attempt to delete your reply and do not persist it in database/logs. Telegram copies or screenshots may remain; the VPS operator can access password/session data. Keep 2FA enabled. Attempt ${pending.passwordAttempts}/3. Cancel: /cancelvoice`;
      const prompt = await this.engine.reply(Number(id), notice, { protect_content: true,
        reply_markup: { force_reply: true, selective: true, input_field_placeholder: bn ? 'নিজের Telegram 2FA password' : 'Your Telegram 2FA password' } });
      if (!Number.isSafeInteger(prompt?.message_id) || prompt.message_id <= 0) throw new Error('Password prompt failed');
      request.message = prompt.message_id;
      this.passwordPrompts.set(`${id}:${request.message}`, Date.now() + 600000);
      while (this.passwordPrompts.size > this.config.mtMaxAccounts * 4)
        this.passwordPrompts.delete(this.passwordPrompts.keys().next().value);
      if (pending.controller.signal.aborted || this.stopped) abort();
      return await promise;
    } finally {
      pending.controller.signal.removeEventListener('abort', abort);
      if (pending.passwordRequest === request) pending.passwordRequest = null;
      await this.deletePrivateMessage(id, request.message);
    }
  }
  async acceptPassword(ctx) {
    if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from?.id || typeof ctx.message?.text !== 'string') return false;
    const id = userId(ctx.from.id), reply = ctx.message.reply_to_message;
    if (reply?.from?.id !== this.selfId || !this.passwordPrompts.has(`${id}:${reply.message_id}`)) return false;
    if (ctx.message.entities?.some(entity => entity.type === 'bot_command' && entity.offset === 0) &&
      /^\/(cancelvoice|disconnectvoice)(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(ctx.message.text)) return false;
    const pending = this.pending.get(id), request = pending?.passwordRequest;
    // Delete recognized replies even when stale, duplicate or cancelled, without reusing them.
    const password = ctx.message.text; ctx.message.text = '';
    await this.deletePrivateMessage(id, ctx.message.message_id);
    if (pending && Date.now() >= pending.expiresAt) pending.controller.abort();
    if (!request || request.message !== reply.message_id || pending.controller.signal.aborted || this.stopped) {
      await this.engine.reply(Number(id), 'This login question has expired. Start a new voice-account connection or reply to the current 2FA question.');
      return true;
    }
    if (!password.length || password.length > 512) {
      await this.engine.reply(Number(id), 'Reply to the current 2FA question with a password of 1–512 characters.');
      return true;
    }
    pending.passwordRequest = null;
    // Only the awaiting SDK callback receives the secret. Never await login completion
    // from the bot queue: verified attachment itself needs this queue afterwards.
    request.resolve(password);
    return true;
  }
  async login(id, target, pending, bn) {
    const { client, controller } = pending;
    const deadline = Date.now() + 300000;
    pending.expiresAt = Date.now() + 120000;
    let timeout = setTimeout(() => controller.abort(), 120000); timeout.unref();
    let attached = false;
    try {
      await client.connect();
      if (controller.signal.aborted || this.stopped) throw new Error('Connection cancelled');
      await client.signInUserWithQrCode({ apiId: this.config.mtApiId, apiHash: this.config.mtApiHash }, {
        abortSignal: controller.signal,
        qrCode: async ({ token }) => {
          if (controller.signal.aborted || this.stopped) throw new Error('Connection cancelled');
          await this.removeQr(id, pending);
          const png = await QRCode.toBuffer(`tg://login?token=${Buffer.from(token).toString('base64url')}`, { width: 384, margin: 4, errorCorrectionLevel: 'M' });
          const message = await this.api.sendPhoto(Number(id), new InputFile(png, 'voice-login.png'), {
            protect_content: true,
            caption: bn ? 'নিজের account দিয়ে Telegram → Settings → Devices → Link Desktop Device থেকে scan করুন। QR অন্য screen-এ দেখান। এটি VPS-এ একটি user session খুলবে; operator account-access পেতে পারে। ২ মিনিটে scan করুন। 2FA থাকলে এরপর bot আলাদা password question দেবে। OTP/login code পাঠাবেন না।' :
              'Scan with your own Telegram account: Settings → Devices → Link Desktop Device. Display this QR on another screen. This opens a user session on the operator VPS; the operator can access that account. Scan within 2 minutes. If 2FA is enabled, the bot asks a separate password question next. Do not send OTP/login codes.',
            reply_markup: { inline_keyboard: [[{ text: bn ? 'বাতিল করুন' : 'Cancel login', callback_data: `voicecancel:${id}` }]] }
          });
          pending.message = message.message_id;
          if (controller.signal.aborted || this.stopped) await this.removeQr(id, pending);
        },
        password: async () => {
          clearTimeout(timeout);
          pending.expiresAt = Math.min(deadline, Date.now() + 120000);
          timeout = setTimeout(() => controller.abort(), Math.max(1, pending.expiresAt - Date.now())); timeout.unref();
          return this.askPassword(id, pending, bn);
        },
        onError: async error => !(error?.errorMessage === 'PASSWORD_HASH_INVALID' &&
          !controller.signal.aborted && !this.stopped && pending.passwordAttempts < 3)
      });
      if (controller.signal.aborted || this.stopped) throw new Error('Connection cancelled');
      const me = await client.getMe();
      if (me.bot || String(me.id) !== id) throw new Error('Scan using the same account that is chatting with this bot');
      const result = await this.queue.run(async () => {
        if (controller.signal.aborted || this.stopped) return false;
        await this.authorized(id, target);
        // Entity resolution may transiently receive last-message data in dialogs;
        // the moderation pipeline does not use or persist that content.
        await client.getDialogs({ limit: 1000 });
        const probe = this.adapterFactory({ config: { ...this.config, mtAllowedChats: new Set([target]) }, store: this.store, engine: this.engine, queue: this.queue, client });
        if (!await probe.rights(target)) throw new Error('Grant this account Manage Video Chats/Live Streams first');
        if (controller.signal.aborted || this.stopped) return false;
        await this.attach(id, client, new Set([target])); attached = true;
        try { await this.vault.save(id, client.session.save(), new Set([target])); }
        catch (error) { await this.detach(id, false); attached = false; throw error; }
        this.store.audit(target, Number(id), 'vc-account-connected'); return true;
      });
      if (!result) throw new Error('Connection not attached');
      await this.engine.reply(Number(id), bn ? 'Account যাচাই করে যুক্ত হয়েছে। /communities খুলে community-র ভয়েস নিয়ন্ত্রণ ON করুন।' :
        'Account verified and connected. Open /communities and enable Voice controls for this community.').catch(error=>logError('vc_account_notify_unavailable',error));
    } catch (error) {
      logError('vc_account_login_failed', error);
      if (!this.stopped) await this.engine.reply(Number(id), pending.needsPassword ?
        (bn ? '2FA login শেষ হয়নি—ভুল password, সময়সীমা, বাতিল বা Telegram error হতে পারে। আবার Voice account connection শুরু করুন। Website/VPS user-login লাগে না; 2FA বন্ধ করবেন না।' : '2FA login did not finish: incorrect password, timeout, cancellation or Telegram error. Start a new voice-account connection. No website or VPS access is required for community users; keep 2FA enabled.') :
        (bn ? 'Account যুক্ত হয়নি। একই account দিয়ে scan, বর্তমান admin/Manage Call permission ও সময়সীমা পরীক্ষা করুন।' : 'Account connection did not finish. Check the same-account scan, current admin/Manage Call rights and timeout.')).catch(() => {});
    } finally {
      clearTimeout(timeout); await this.removeQr(id, pending); this.pending.delete(id);
      if (!attached) {
        // Revoke rejected/new login sessions where possible; disconnect always.
        try { if (await client.checkAuthorization()) await client.invoke(new Api.auth.LogOut()); } catch { /* Best effort, revoke in Settings > Devices if needed. */ }
        await client.disconnect().catch(() => {});
      }
    }
  }
  cancel(owner) { this.pending.get(userId(owner))?.controller.abort(); }
  async detach(owner, revoke = true) {
    const id = userId(owner), entry = this.adapters.get(id);
    if (!entry) { await this.vault?.remove(id); return; }
    this.adapters.delete(id);
    for (const [chat, actor] of this.bindings) if (actor === id) this.bindings.delete(chat);
    if (revoke) try { await entry.adapter.client.invoke(new Api.auth.LogOut()); } catch (error) { logError('vc_logout_failed', error); }
    await entry.adapter.stop(); await this.vault?.remove(id);
  }
  async disconnect(owner) { this.cancel(owner); await this.detach(owner); }
  async stop() {
    this.stopped = true;
    for (const pending of this.pending.values()) pending.controller.abort();
    await Promise.allSettled([...this.jobs]);
    await this.legacy?.stop();
    await Promise.allSettled([...this.adapters.values()].map(entry => entry.adapter.stop()));
    this.adapters.clear(); this.bindings.clear();
  }
}

export function installVoiceAccounts({ bot, engine }) {
  // Consume bound password replies before recovery commands/access-gate middleware,
  // including a password beginning with a slash. Message text never enters persistence.
  bot.use(async (ctx, next) => await engine.vc?.acceptPassword?.(ctx) ? undefined : next());
  bot.command('cancelvoice', async ctx => {
    if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) return;
    engine.vc?.cancel?.(ctx.from.id);
    await engine.reply(ctx.from.id, 'Voice-account login cancelled. A connected account can be removed with /disconnectvoice.');
  });
  bot.callbackQuery(/^voicecancel:(\d+)$/, async ctx => {
    if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id || String(ctx.from.id) !== ctx.match[1]) return;
    await engine.call('answerCallbackQuery', ctx.from.id, ctx.callbackQuery.id);
    engine.vc?.cancel?.(ctx.from.id);
  });
  bot.command('disconnectvoice', async ctx => {
    if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) return;
    await engine.vc?.disconnect?.(ctx.from.id);
    await engine.reply(ctx.from.id, 'Your connected QR voice account has been detached from all communities. Check Telegram Settings > Devices and terminate the Sentinel-VC session if it remains. Local operator sessions are managed on the VPS.');
  });
}
