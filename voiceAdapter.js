import { readFile } from 'node:fs/promises';
import bigInt from 'big-integer';
import { Api, TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { Raw } from 'teleproto/events';
import { ActionBudget, counters, log, logError } from './runtime.js';
import { VoiceBurstDetector } from './voiceShield.js';

// Only join/leave transitions are attributed. Mute/volume changes can originate
// from administrators and must not be charged to the participant as abuse.
export class ParticipantNormalizer {
  constructor(limit = 50000) { this.limit = Math.min(limit, 10000); this.versions = new Map(); }
  reset(callId, version) {
    this.versions.set(String(callId), { version, participantsSeen: false });
    if (this.versions.size > this.limit) this.versions.delete(this.versions.keys().next().value);
  }
  applyCall(call) {
    const previous = this.versions.get(String(call.id));
    if (!previous || call.version > previous.version + 1) return { gap: true };
    if (call.version === previous.version + 1) this.reset(call.id, call.version);
    return { gap: false };
  }
  normalize(update) {
    const callId = String(update.call.id);
    const previous = this.versions.get(callId);
    if (previous === undefined) return { gap: true, events: [] };
    const versioned = update.participants.some(p => p.versioned || p.left || p.justJoined);
    if (!versioned) return { gap: false, events: [] };
    if (update.version < previous.version || (update.version === previous.version && previous.participantsSeen)) return { gap: false, events: [] };
    if (update.version > previous.version + 1) return { gap: true, events: [] };
    this.versions.set(callId, { version: update.version, participantsSeen: true });
    const events = [];
    for (const participant of update.participants) {
      if (!(participant.peer instanceof Api.PeerUser)) continue; // Channel identities are not user IDs.
      const userId = String(participant.peer.userId);
      const kind = participant.left ? 'vc_leave' : participant.justJoined ? 'vc_join' : null;
      if (!kind) continue;
      events.push({ userId, kind });
    }
    return { gap: false, events };
  }
}

export class VoiceAdapter {
  constructor({ config, store, engine, queue, client = null }) {
    Object.assign(this, { config, store, engine, queue, client });
    this.calls = new Map(); this.states = new Map(); this.entities = new Map();
    this.normalizer = new ParticipantNormalizer(config.maxUsers);
    this.shield = new VoiceBurstDetector(config);
    this.budget = new ActionBudget();
    this.stopped = false; this.refreshPending = false; this.lastRefresh = 0;
  }
  capability(chatId) {
    if (!this.config.mtAllowedChats.has(String(chatId))) return 'not allowlisted';
    if (!this.client?.connected) return 'disconnected';
    const entry = [...this.calls.values()].find(x => x.chatId === String(chatId));
    if (entry && Date.now() - entry.checkedAt > 120000) return 'stale call state; awaiting refresh';
    return this.states.get(String(chatId)) || 'awaiting opt-in/refresh';
  }
  async rpc(chatId, request) {
    if (!this.budget.allow(chatId)) { const error = new Error('MTProto budget exhausted'); error.name = 'BudgetExceeded'; throw error; }
    try { return await this.client.invoke(request, undefined, { timeout: 10000, maxRetryCount: 0, floodSleepThreshold: 0 }); }
    catch (error) { this.budget.pause(error); throw error; }
  }
  async start() {
    if (!this.client) {
      const session = (await readFile(this.config.mtSessionFile, 'utf8')).trim();
      if (!session) throw new Error('MTProto session is empty; run npm run mtproto:login');
      this.client = new TelegramClient(new StringSession(session), this.config.mtApiId, this.config.mtApiHash,
        { connectionRetries: 3, reconnectRetries: 3, requestRetries: 1, floodSleepThreshold: 0, timeout: 10 });
      this.client.setLogLevel('none');
    }
    await this.client.connect();
    if (!await this.client.checkAuthorization()) throw new Error('MTProto session is unauthorized');
    const me = await this.client.getMe();
    if (me.bot) throw new Error('Direct VC moderation requires a USER session');
    this.meId = String(me.id);
    // Warm entity cache; getDialogs may deliver last-message data transiently,
    // but the moderation pipeline neither uses nor persists those contents.
    await this.client.getDialogs({ limit: Math.min(this.config.mtAllowedChats.size * 2 + 20, 1000) });
    this.raw = new Raw({ types: [Api.UpdateGroupCallParticipants, Api.UpdateGroupCall] });
    this.handler = update => {
      if (this.stopped) return;
      // Return immediately: awaiting the application queue from a Telegram update
      // handler can deadlock an RPC whose response itself dispatches updates.
      void this.queue.run(() => this.handle(update)).catch(error => logError('vc_update_failed', error));
    };
    this.client.addEventHandler(this.handler, this.raw);
    await this.refresh();
    this.timer = setInterval(() => this.requestRefresh(), 60000);
    this.timer.unref();
    log('vc_adapter_connected');
  }
  requestRefresh() {
    if (this.stopped || this.refreshPending) return;
    const remaining=5000-(Date.now()-this.lastRefresh);
    if (remaining>0) {
      if (!this.refreshLater) this.refreshLater=setTimeout(()=>{ this.refreshLater=null; this.requestRefresh(); },remaining);
      this.refreshLater?.unref(); return;
    }
    this.refreshPending = true;
    void this.queue.run(async () => {
      try { await this.refresh(); } finally { this.refreshPending = false; }
    }).catch(error => { this.refreshPending = false; logError('vc_refresh_failed', error); });
  }
  async channel(chatId) {
    if (this.entities.has(String(chatId))) return this.entities.get(String(chatId));
    const peer = await this.client.getInputEntity(bigInt(String(chatId)));
    if (!(peer instanceof Api.InputPeerChannel)) throw new Error('Only supergroups and broadcast channels are supported');
    const channel = new Api.InputChannel({ channelId: peer.channelId, accessHash: peer.accessHash });
    this.entities.set(String(chatId), channel);
    return channel;
  }
  async rights(chatId) {
    const result = await this.rpc(chatId, new Api.channels.GetParticipant({ channel: await this.channel(chatId), participant: new Api.InputPeerSelf() }));
    return result.participant instanceof Api.ChannelParticipantCreator ||
      (result.participant instanceof Api.ChannelParticipantAdmin && result.participant.adminRights.manageCall === true);
  }
  async refresh() {
    this.lastRefresh = Date.now();
    const enabled = this.store.groups().filter(group => group.vc && this.config.mtAllowedChats.has(group.id));
    const ids = new Set(enabled.map(group => group.id));
    for (const [callId, entry] of this.calls) if (!ids.has(entry.chatId)) this.calls.delete(callId);
    for (const key of this.entities.keys()) if (!ids.has(key)) this.entities.delete(key);
    for (const key of this.states.keys()) if (!ids.has(key)) this.states.delete(key);
    for (const group of enabled) {
      try {
        if (!await this.rights(group.id)) { this.states.set(group.id, 'missing manage-call rights'); this.dropChat(group.id); continue; }
        const full = await this.rpc(group.id, new Api.channels.GetFullChannel({ channel: await this.channel(group.id) }));
        const inputCall = full.fullChat.call;
        if (!inputCall) { this.dropChat(group.id); this.states.set(group.id, 'no active call'); continue; }
        const previous = this.calls.get(String(inputCall.id));
        if (previous && Date.now() - previous.synchronizedAt < 120000) {
          previous.checkedAt = Date.now(); this.states.set(group.id, previous.coverage || 'call-state monitoring');
          if (group.vcGuard && group.mode === 'enforce' && (!previous.joinMuted || (group.vcRotateInvites && !previous.guardRotated)))
            await this.setAdmission(group.id, true, group, 'preemptive');
          continue;
        }
        await this.synchronize(group.id, inputCall);
        const active = this.entry(group.id);
        if (active && group.vcGuard && group.mode === 'enforce' && (!active.joinMuted || (group.vcRotateInvites && !active.guardRotated)))
          await this.setAdmission(group.id, true, group, 'preemptive');
      } catch (error) {
        this.dropChat(group.id); this.states.set(group.id, 'unavailable; review credentials/rights');
        logError('vc_chat_unavailable', error);
      }
    }
  }
  dropChat(chatId) {
    for (const [key, entry] of this.calls) if (entry.chatId === String(chatId)) {
      this.calls.delete(key); this.normalizer.versions.delete(key);
      this.shield.forget(key);
    }
  }
  async synchronize(chatId, inputCall) {
    const previous=this.entry(chatId);
    // Invalidate the old snapshot before an RPC that can fail or time out.
    this.dropChat(chatId);
    this.states.set(String(chatId), 'resynchronizing; current updates suppressed');
    let result;
    try { result = await this.rpc(chatId, new Api.phone.GetGroupCall({ call: inputCall, limit: 1 })); }
    catch (error) { this.states.set(String(chatId), 'unavailable; resynchronization failed'); throw error; }
    if (!(result.call instanceof Api.GroupCall) || result.call.rtmpStream || result.call.conference || result.call.scheduleDate) {
      this.states.set(String(chatId), 'unsupported or scheduled call'); return;
    }
    const coverage = result.call.listenersHidden ? 'partial call-state monitoring; listeners hidden' : 'call-state monitoring';
    this.calls.set(String(inputCall.id), { chatId: String(chatId), call: inputCall,
      checkedAt: Date.now(), synchronizedAt: Date.now(), coverage, joinMuted: Boolean(result.call.joinMuted),
      guardRotated: String(previous?.call?.id) === String(inputCall.id) && previous?.guardRotated === true });
    this.normalizer.reset(inputCall.id, result.call.version);
    this.states.set(String(chatId), coverage);
  }
  async handle(update) {
    if (update instanceof Api.UpdateGroupCall) {
      const entry = this.calls.get(String(update.call.id));
      if (entry && update.call instanceof Api.GroupCallDiscarded) {
        this.dropChat(entry.chatId); this.states.set(entry.chatId, 'no active call');
      }
      else if (entry) {
        if (update.call.rtmpStream || update.call.conference || update.call.scheduleDate) {
          this.dropChat(entry.chatId); this.states.set(entry.chatId, 'unsupported or scheduled call');
        } else {
          entry.coverage = update.call.listenersHidden ? 'partial call-state monitoring; listeners hidden' : 'call-state monitoring';
          entry.joinMuted = Boolean(update.call.joinMuted);
          this.states.set(entry.chatId, entry.coverage);
          if (this.normalizer.applyCall(update.call).gap) await this.synchronize(entry.chatId, entry.call);
        }
      }
      this.requestRefresh(); return;
    }
    const entry = this.calls.get(String(update.call.id));
    if (!entry || !this.store.group(entry.chatId)?.vc || !this.config.mtAllowedChats.has(entry.chatId)) return;
    if (Date.now() - entry.checkedAt > 120000 || !this.client.connected) return;
    const normalized = this.normalizer.normalize(update);
    if (normalized.gap) {
      this.states.set(entry.chatId, 'resynchronizing; current update suppressed');
      await this.synchronize(entry.chatId, entry.call); return;
    }
    for (const event of normalized.events) {
      if (event.userId === this.meId) continue;
      const id = Number(event.userId);
      if (!Number.isSafeInteger(id)) continue;
      const settings = this.store.group(entry.chatId);
      if (settings?.vcShield) {
        const burst = this.shield.observe(entry.call.id, event);
        if (burst?.suspicious && this.store.claim(`vc-raid:${entry.call.id}:${settings.mode}`, 60000)) {
          this.store.audit(entry.chatId, null, 'vc-raid-observed', burst);
          if (settings.mode === 'enforce') {
            try { await this.setAdmission(entry.chatId, true, settings, 'raid'); }
            catch (error) {
              this.store.audit(entry.chatId, null, 'vc-shield-failed', { type: error.name });
              logError('vc_shield_failed', error);
            }
          }
          await this.engine.notifyVoiceIncident?.(Number(entry.chatId), burst, settings.mode);
        }
      }
      await this.engine.process({ chatId: Number(entry.chatId), userId: id, kind: event.kind });
    }
  }
  entry(chatId) { return [...this.calls.values()].find(x => x.chatId === String(chatId)); }
  async endCall(chatId, settings, expectedCallId) {
    if (!settings?.vc || !this.config.mtAllowedChats.has(String(chatId))) throw new Error('Voice opt-in and allowlist required');
    const entry = this.entry(chatId);
    if (!entry || String(entry.call.id) !== String(expectedCallId) || Date.now()-entry.checkedAt>120000 || !this.client?.connected)
      throw new Error('Confirmed call is no longer current');
    if (!await this.rights(chatId)) throw new Error('Current manage-call rights required');
    // Confirm against Telegram as well as the snapshot, so a replacement call cannot be ended.
    const full = await this.rpc(chatId, new Api.channels.GetFullChannel({channel:await this.channel(chatId)}));
    if (String(full.fullChat.call?.id) !== String(expectedCallId)) throw new Error('Call changed since confirmation');
    this.store.audit(chatId,null,'vc-end-intent',{callId:String(entry.call.id)});
    await this.rpc(chatId,new Api.phone.DiscardGroupCall({call:entry.call}));
    this.store.audit(chatId,null,'vc-end-acknowledged',{callId:String(entry.call.id)});
    this.dropChat(chatId);this.states.set(String(chatId),'no active call');
    return true;
  }
  async setAdmission(chatId, muted, settings, reason = 'manual') {
    if (!settings?.vc || !this.config.mtAllowedChats.has(String(chatId))) throw new Error('Voice opt-in and allowlist required');
    if (reason !== 'manual' && settings.mode !== 'enforce') return false;
    const entry = this.entry(chatId);
    if (!entry || Date.now() - entry.checkedAt > 120000 || !this.client?.connected) throw new Error('No fresh supported active call');
    if (!await this.rights(chatId)) throw new Error('Current user-account manage-call rights required');
    const rotate = muted && settings.vcRotateInvites === true;
    this.store.audit(chatId, null, 'vc-admission-intent', { callId: String(entry.call.id), muted, rotate, reason });
    try {
      await this.rpc(chatId, new Api.phone.ToggleGroupCallSettings({ call: entry.call, joinMuted: muted,
        ...(rotate ? { resetInviteHash: true } : {}) }));
    } catch (error) {
      // A no-change response is success only for the idempotent non-rotation operation.
      if (rotate || error?.errorMessage !== 'GROUPCALL_NOT_MODIFIED') throw error;
    }
    entry.joinMuted = muted;
    if (rotate) entry.guardRotated=true;
    this.store.audit(chatId, null, 'vc-admission-acknowledged', { callId: String(entry.call.id), muted, rotate, reason });
    return true;
  }
  async mitigate(chatId, userId, settings) {
    if (!settings.vc || settings.mode !== 'enforce' || !this.config.mtAllowedChats.has(String(chatId))) return false;
    const entry = [...this.calls.values()].find(x => x.chatId === String(chatId));
    if (!entry || Date.now() - entry.checkedAt > 120000 || !this.client.connected) return false;
    // Fresh checks for both target and operator rights on every action.
    if (await this.engine.administrator(chatId, userId) || !await this.rights(chatId)) return false;
    const peer = await this.client.getInputEntity(bigInt(userId));
    if (!(peer instanceof Api.InputPeerUser)) return false;
    const current = await this.rpc(chatId, new Api.phone.GetGroupParticipants({ call: entry.call,
      ids: [peer], sources: [], offset: '', limit: 1 }));
    const participant = current.participants.find(p => p.peer instanceof Api.PeerUser && String(p.peer.userId) === String(userId));
    if (participant && !participant.left && !(participant.muted && !participant.canSelfUnmute)) {
      this.store.audit(chatId, userId, 'vc-mute-intent', { callId: String(entry.call.id) });
      await this.rpc(chatId, new Api.phone.EditGroupCallParticipant({ call: entry.call, participant: peer, muted: true }));
      counters.vcMutes++;
      this.store.audit(chatId, userId, 'vc-mute-acknowledged', { callId: String(entry.call.id) });
      await this.engine.notifyVoiceRestriction?.(chatId, userId);
    }
    if (settings.vcLock && this.store.claim(`vclock:${entry.call.id}`, 60000)) {
      this.store.audit(chatId, null, 'vc-join-muted-intent', { callId: String(entry.call.id) });
      await this.rpc(chatId, new Api.phone.ToggleGroupCallSettings({ call: entry.call, joinMuted: true }));
      this.store.audit(chatId, null, 'vc-join-muted-acknowledged', { callId: String(entry.call.id) });
    }
    return true;
  }
  async stop() {
    this.stopped = true; clearInterval(this.timer); clearTimeout(this.refreshLater);
    if (this.handler) this.client.removeEventHandler(this.handler, this.raw);
    if (this.client) await this.client.disconnect();
  }
}
