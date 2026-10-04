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
  async login(id, target, pending, bn) {
    const { client, controller } = pending;
    const timeout = setTimeout(() => controller.abort(), 120000); timeout.unref();
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
            caption: bn ? 'নিজের account দিয়ে Telegram → Settings → Devices → Link Desktop Device থেকে scan করুন। QR অন্য screen-এ দেখান। এটি VPS-এ একটি user session খুলবে; operator account-access পেতে পারে। ২ মিনিটে শেষ করুন। OTP/password bot-এ পাঠাবেন না।' :
              'Scan with your own Telegram account: Settings → Devices → Link Desktop Device. Display this QR on another screen. This opens a user session on the operator VPS; the operator can access that account. Finish within 2 minutes. Never send OTP/password to the bot.',
            reply_markup: { inline_keyboard: [[{ text: bn ? 'বাতিল করুন' : 'Cancel login', callback_data: `voicecancel:${id}` }]] }
          });
          pending.message = message.message_id;
          if (controller.signal.aborted || this.stopped) await this.removeQr(id, pending);
        },
        password: async () => { pending.needsPassword = true; const error = new Error('Use local login for an account requiring a 2FA password'); error.name = 'LocalPasswordRequired'; throw error; },
        onError: async () => true
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
        (bn ? 'Telegram এই account-এর 2FA password চেয়েছে। Bot password নেয় না। নিজের VPS-এ local login ব্যবহার করুন; 2FA বন্ধ করবেন না।' : 'Telegram requires this account’s 2FA password. The bot does not collect it. Use local login on your own VPS; keep 2FA enabled.') :
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
