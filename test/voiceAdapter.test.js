import test from 'node:test';
import assert from 'node:assert/strict';
import bigInt from 'big-integer';
import { Api } from 'teleproto';
import { ParticipantNormalizer, VoiceAdapter } from '../voiceAdapter.js';
import { Store } from '../store.js';
import { SerialQueue } from '../runtime.js';
import { loadConfig } from '../config.js';

const call = new Api.InputGroupCall({ id: bigInt(77), accessHash: bigInt(88) });
const p = overrides => new Api.GroupCallParticipant({ peer: new Api.PeerUser({ userId: bigInt(1) }),
  date: Math.floor(Date.now() / 1000), source: 23, ...overrides });
const update = (version, participants) => new Api.UpdateGroupCallParticipants({ call, version, participants });
test('MTProto normalization rejects replay, old revisions, channel participant identities, and unattributed moderator actions', () => {
  const normalizer = new ParticipantNormalizer(); normalizer.reset(77, 1);
  const joined = update(2, [p({ justJoined: true })]);
  assert.equal(normalizer.normalize(joined).events[0].kind, 'vc_join');
  assert.equal(normalizer.normalize(joined).events.length, 0);
  assert.equal(normalizer.normalize(update(1, [p({ justJoined: true })])).events.length, 0);
  assert.equal(normalizer.normalize(update(3, [p({ muted: true })])).events.length, 0);
  assert.equal(normalizer.normalize(update(3, [p({ justJoined: true, peer: new Api.PeerChannel({ channelId: bigInt(4) }) })])).events.length, 0);
});

test('broadcast-channel host discovery routes delivered user events and exposes hidden-listener coverage', async t => {
  const store = new Store(':memory:'); t.after(() => store.close());
  const id = '-1001234567890', seen = [], requests = [];
  store.setGroup(id, { chatType: 'channel', vc: true, mode: 'observe' });
  const config = { ...loadConfig({}, { requireToken: false }), mtAllowedChats: new Set([id]) };
  let hidden = true, rtmp = false, authorized = true;
  const client = { connected: true, getInputEntity: async () => new Api.InputPeerChannel({ channelId: bigInt(1234567890), accessHash: bigInt(88) }),
    invoke: async request => {
      requests.push(request);
      if (request instanceof Api.channels.GetParticipant) return { participant: authorized ?
        new Api.ChannelParticipantCreator({ userId: bigInt(9) }) : new Api.ChannelParticipant({ userId: bigInt(9), date: 1 }) };
      if (request instanceof Api.channels.GetFullChannel) return { fullChat: { call } };
      if (request instanceof Api.phone.GetGroupCall) return { call: new Api.GroupCall({ id: bigInt(77), accessHash: bigInt(88),
        participantsCount: 1, version: 1, unmutedVideoLimit: 10, listenersHidden: hidden, rtmpStream: rtmp }) };
      throw new Error('Unexpected method');
    } };
  const adapter = new VoiceAdapter({ config, store, client, queue: new SerialQueue(), engine: { process: async e => seen.push(e) } });
  adapter.budget = { allow: () => true, pause() {} };
  await adapter.refresh();
  assert.match(adapter.capability(id), /listeners hidden/);
  await adapter.handle(update(2, [p({ justJoined: true })]));
  assert.equal(seen[0].chatId, Number(id)); assert.equal(seen[0].kind, 'vc_join');
  await adapter.refresh(); assert.match(adapter.capability(id), /listeners hidden/);
  rtmp = true; adapter.dropChat(id); await adapter.refresh();
  assert.equal(adapter.calls.size, 0); assert.match(adapter.capability(id), /unsupported/);
  rtmp = false; hidden = false; await adapter.refresh(); assert.equal(adapter.calls.size, 1);
  authorized = false; await adapter.refresh(); assert.equal(adapter.calls.size, 0);
  assert.match(adapter.capability(id), /missing manage-call/);
});
test('missing revisions suppress inference until resynchronization', () => {
  const normalizer = new ParticipantNormalizer(); normalizer.reset(77, 1);
  assert.equal(normalizer.normalize(update(9, [p({ justJoined: true })])).gap, true);
  normalizer.reset(77, 9);
  assert.equal(normalizer.normalize(update(10, [p({ left: true })])).events[0].kind, 'vc_leave');
});
test('a call-info update permits exactly one same-revision participant update', () => {
  const normalizer = new ParticipantNormalizer(); normalizer.reset(77, 1);
  assert.equal(normalizer.applyCall({ id: 77, version: 2 }).gap, false);
  assert.equal(normalizer.normalize(update(2, [p({ justJoined: true })])).events.length, 1);
  assert.equal(normalizer.normalize(update(2, [p({ justJoined: true })])).events.length, 0);
});
test('real TL requests serialize with supported mute and join-muted fields', () => {
  const peer = new Api.InputPeerUser({ userId: bigInt(1), accessHash: bigInt(2) });
  for (const request of [new Api.phone.EditGroupCallParticipant({ call, participant: peer, muted: true }),
    new Api.phone.ToggleGroupCallSettings({ call, joinMuted: true }),
    new Api.phone.GetGroupParticipants({ call, ids: [peer], sources: [], offset: '', limit: 1 })]) {
    assert.ok(request.getBytes().length > 16);
  }
});
test('VC mitigation uses fresh authority checks and only the allowlisted active call', async t => {
  const store = new Store(':memory:'); t.after(() => store.close());
  const config = { ...loadConfig({}, { requireToken: false }), mtAllowedChats: new Set(['-1001']) };
  const requests = []; const peer = new Api.InputPeerUser({ userId: bigInt(1), accessHash: bigInt(2) });
  const client = { connected: true, getInputEntity: async () => peer, invoke: async request => {
    requests.push(request);
    if (request instanceof Api.channels.GetParticipant) return { participant: new Api.ChannelParticipantCreator({ userId: bigInt(9) }) };
    if (request instanceof Api.phone.GetGroupParticipants) return { participants: [p({ muted: false })] };
    return {};
  } };
  const adapter = new VoiceAdapter({ config, store, client, queue: new SerialQueue(), engine: { administrator: async () => false } });
  adapter.entities.set('-1001', new Api.InputChannel({ channelId: bigInt(1), accessHash: bigInt(2) }));
  adapter.calls.set('77', { chatId: '-1001', call, checkedAt: Date.now() });
  assert.equal(await adapter.mitigate(-1002, 1, { vc: true, mode: 'enforce' }), false);
  assert.equal(requests.length, 0);
  assert.equal(await adapter.mitigate(-1001, 1, { vc: true, vcLock: true, mode: 'enforce' }), true);
  assert.ok(requests.some(r => r instanceof Api.phone.EditGroupCallParticipant && r.muted === true));
  assert.ok(requests.some(r => r instanceof Api.phone.ToggleGroupCallSettings && r.joinMuted === true));
});
test('VC mitigation preserves administrator immunity and refuses stale call mapping', async t => {
  const store = new Store(':memory:'); t.after(() => store.close());
  let requests = 0;
  const config = { ...loadConfig({}, { requireToken: false }), mtAllowedChats: new Set(['-1001']) };
  const adapter = new VoiceAdapter({ config, store, queue: new SerialQueue(),
    engine: { administrator: async () => true }, client: { connected: true, invoke: async () => { requests++; } } });
  adapter.calls.set('77', { chatId: '-1001', call, checkedAt: Date.now() });
  assert.equal(await adapter.mitigate(-1001, 1, { vc: true, mode: 'enforce' }), false);
  adapter.calls.get('77').checkedAt = 1;
  assert.equal(await adapter.mitigate(-1001, 1, { vc: true, mode: 'enforce' }), false);
  assert.equal(requests, 0);
  assert.match(adapter.capability(-1001), /stale/);
});

test('failed gap resynchronization invalidates old call state and suppresses later events', async t => {
  const store = new Store(':memory:'); t.after(() => store.close());
  store.setGroup(-1001, { vc: true, mode: 'enforce' });
  let processed = 0;
  const config = { ...loadConfig({}, { requireToken: false }), mtAllowedChats: new Set(['-1001']) };
  const adapter = new VoiceAdapter({ config, store, queue: new SerialQueue(),
    engine: { process: async () => { processed++; } },
    client: { connected: true, invoke: async () => { throw new Error('offline'); } } });
  adapter.calls.set('77', { chatId: '-1001', call, checkedAt: Date.now() });
  adapter.normalizer.reset(77, 1);
  await assert.rejects(() => adapter.handle(update(9, [p({ justJoined: true })])), /offline/);
  assert.equal(adapter.calls.size, 0);
  assert.equal(adapter.normalizer.versions.has('77'), false);
  assert.match(adapter.capability(-1001), /resynchronization failed/);
  await adapter.handle(update(2, [p({ justJoined: true })]));
  assert.equal(processed, 0);
});
