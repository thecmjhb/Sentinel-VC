import { randomBytes } from 'node:crypto';
import { createChallenge } from './challenges.js';
import { AntiFlood } from './antiFlood.js';
import { ActionBudget, counters, logError } from './runtime.js';

export const PERMISSIONS = ['can_send_messages', 'can_send_audios', 'can_send_documents', 'can_send_photos',
  'can_send_videos', 'can_send_video_notes', 'can_send_voice_notes', 'can_send_polls', 'can_send_other_messages',
  'can_add_web_page_previews', 'can_change_info', 'can_invite_users', 'can_pin_messages', 'can_manage_topics',
  'can_react_to_messages', 'can_edit_tag'];
export const permissionSet = value => Object.fromEntries(PERMISSIONS.map(key => [key, value]));
export const isAdmin = member => ['creator', 'administrator'].includes(member?.status);
export const isPresent = member => ['creator', 'administrator', 'member'].includes(member?.status) ||
  (member?.status === 'restricted' && member.is_member === true);

export class SecurityEngine {
  constructor({ config, store, api, clock, budget = new ActionBudget() }) {
    this.config = config; this.store = store; this.api = api; this.budget = budget;
    this.flood = new AntiFlood(config, clock);
    this.vc = null;
  }
  async call(method, chatId, ...args) {
    if (!this.budget.allow(chatId)) {
      const error = new Error('Action budget exhausted'); error.name = 'BudgetExceeded'; throw error;
    }
    try { return await this.api[method](...args); }
    catch (error) { this.budget.pause(error); throw error; }
  }
  async reply(chatId, text, options = {}) {
    if (!Number.isSafeInteger(chatId) || chatId <= 0) throw new Error('Messages are private-only');
    return this.call('sendMessage', chatId, chatId, text, options);
  }
  async administrator(chatId, userId) {
    return isAdmin(await this.call('getChatMember', chatId, chatId, userId));
  }
  async notifyVoiceRestriction(chatId, userId) {
    try {
      await this.reply(userId, `Live-call mute / লাইভ কলে মিউট\nCommunity ID: ${chatId}\n` +
        'An administrator must review your speaking permission in Telegram. Chat CAPTCHA does not unmute a live call.\n' +
        'কথা বলার permission খুলতে community admin-এর review লাগবে।');
    } catch (error) {
      this.store.audit(chatId, userId, 'voice-dm-unavailable');
      logError('voice_dm_unavailable', error);
    }
  }
  async notifyVoiceIncident(chatId, burst, mode) {
    // Notify only administrators who explicitly registered this community, with fresh authority.
    for (const id of this.store.communityAdministrators(chatId, 3)) {
      try {
        if (!await this.administrator(chatId, Number(id))) { this.store.unlinkCommunity(chatId, id); continue; }
        await this.reply(Number(id), `Voice join burst / কলে হঠাৎ যোগদান\nCommunity ID: ${chatId}\n` +
          `${burst.uniqueJoins} distinct user joins in ${burst.windowSeconds}s; threshold ${burst.threshold}. Mode: ${mode}.\n` +
          'This is a call-state anomaly, not proof of malicious users or UDP loss. Open /communities → Incidents to review admission action results.');
      } catch (error) { logError('voice_alert_unavailable', error); }
    }
  }
  async enroll(chatId, userId, botId) {
    if (!await this.administrator(chatId, userId)) return false;
    const bot = await this.call('getChatMember', chatId, chatId, botId);
    if (!isAdmin(bot) || !bot.can_restrict_members) throw new Error('Bot needs administrator and restrict-members rights');
    if (!this.store.group(chatId) && this.store.groups().length >= this.config.maxGroups) throw new Error('Group capacity exceeded');
    this.store.setGroup(chatId, this.store.group(chatId) || { mode: this.config.mode, gate: false, vc: false, vcLock: false });
    this.store.audit(chatId, userId, 'enroll');
    return true;
  }
  async process(event) {
    const settings = this.store.group(event.chatId);
    if (!settings || event.isBot) return null;
    // Broadcast subscriber/post activity cannot use supergroup restriction semantics.
    if (settings.chatType === 'channel' && !event.kind.startsWith('vc_')) return null;
    if (event.kind.startsWith('vc_') && !settings.vc) return null;
    counters.events++;
    const detection = this.flood.observe(event);
    if (event.kind === 'join' && settings.gate && settings.mode === 'enforce') {
      await this.gate(event.chatId, event.userId, 'join-gate');
    }
    if (!detection.attack) return detection;
    counters.detections++;
    // Durable cooldown bounds API amplification and duplicate/replayed mitigation.
    if (!this.store.claim(`detect:${event.chatId}:${event.userId}:${event.kind.startsWith('vc_') ? 'vc' : 'bot'}`, 60000)) return detection;
    this.store.audit(event.chatId, event.userId, 'detect', { score: detection.score, kind: event.kind });
    if (settings.mode === 'observe') { counters.observed++; return detection; }
    try {
      if (event.kind.startsWith('vc_')) {
        if (this.vc) {
          await this.vc.mitigate(event.chatId, event.userId, settings);
          // VC restoration stays with an administrator; CAPTCHA never un-mutes a call.
        }
      } else if (event.kind !== 'leave') {
        await this.gate(event.chatId, event.userId, 'flood', this.config.restrictionSeconds);
      }
    } catch (error) {
      this.store.audit(event.chatId, event.userId, 'mitigation-failed', { type: error.name });
      logError('mitigation_failed', error);
    }
    return detection;
  }
  async gate(chatId, userId, reason, seconds = this.config.captchaSeconds) {
    if (this.store.group(chatId)?.chatType === 'channel') return false;
    if (this.store.gate(chatId, userId)) return false;
    // Do not overwrite another moderator's existing restriction or administrator rights.
    const member = await this.call('getChatMember', chatId, chatId, userId);
    if (member.status !== 'member' || member.user?.is_bot) return false;
    const gate = { token: randomBytes(12).toString('hex'), ...createChallenge(),
      attempts: 0, until: Math.floor(Date.now() / 1000) + seconds, phase: 'pending', reason,
      verifyAfter: reason === 'flood' ? Date.now() + 60000 : 0 };
    // Persist intent first. A process crash cannot strand an untracked permanent mute.
    this.store.setGate(chatId, userId, gate);
    try {
      await this.call('restrictChatMember', chatId, chatId, userId, permissionSet(false),
        { until_date: gate.until, use_independent_chat_permissions: true });
      gate.phase = 'active';
      this.store.setGate(chatId, userId, gate);
      counters.restrictions++;
      this.store.audit(chatId, userId, 'restricted', { until: gate.until, reason });
      // Failed DM delivery does not undo a successful bounded restriction or post publicly.
      try { await this.showGate(chatId, userId, gate); }
      catch (error) { this.store.audit(chatId, userId, 'verification-dm-unavailable'); logError('verification_dm_unavailable', error); }
      return true;
    } catch (error) {
      // A request may succeed before its acknowledgement is lost. Preserve pending intent
      // until expiry; /verify confirms the actual remote restriction before lifting it.
      logError('gate_failed', error);
      return false;
    }
  }
  async showGate(chatId, userId, gate = this.store.gate(chatId, userId), destinationChatId = userId) {
    if (!gate || gate.until * 1000 <= Date.now()) return false;
    if (destinationChatId !== userId || userId <= 0) throw new Error('Challenge delivery must be private and user-bound');
    // Numeric options from schema-v1 gates remain recoverable after upgrade.
    const buttons = gate.options.map(option => ({ text: String(option?.label ?? option),
      callback_data: `sv:${chatId}:${gate.token}:${option?.id ?? option}` }));
    const keyboard = { inline_keyboard: [buttons.slice(0, 2), buttons.slice(2)].filter(row => row.length) };
    await this.reply(userId, `Verification / যাচাই\nCommunity ID: ${chatId}\n${gate.question}\n` +
      `Select an answer to restore chat permissions. Only you can answer; three wrong answers exhaust this challenge. ` +
      `Restrictions expire automatically. This does not unmute a live call.`, { reply_markup: keyboard });
    return true;
  }
  async verify(chatId, userId, token, answer) {
    const gate = this.store.gate(chatId, userId);
    if (!gate || gate.token !== token || gate.until * 1000 <= Date.now()) return 'Challenge expired.';
    if (Date.now() < (gate.verifyAfter || 0)) return 'Flood cooldown active. Try again after one minute.';
    if (gate.attempts >= 3) return 'Attempt limit reached. Wait for expiry or ask an administrator.';
    if (String(gate.answer) !== String(answer)) {
      gate.attempts++;
      this.store.setGate(chatId, userId, gate);
      return 'Incorrect answer.';
    }
    const member = await this.call('getChatMember', chatId, chatId, userId);
    // Restoration is refused after any visible moderator change. Bot API has no CAS;
    // there is still a documented read/write race with concurrent administrators.
    const owned = member.status === 'restricted' && member.is_member && member.until_date === gate.until &&
      PERMISSIONS.every(key => member[key] !== true);
    if (!owned) return 'Permissions changed. Ask an administrator to review.';
    await this.call('restrictChatMember', chatId, chatId, userId, permissionSet(true), { use_independent_chat_permissions: true });
    this.store.deleteGate(chatId, userId);
    this.store.audit(chatId, userId, 'verified');
    return 'Verified. Chat permissions restored.';
  }
}
