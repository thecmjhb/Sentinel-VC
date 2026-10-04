import test from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from 'grammy';
import { createApplication } from '../index.js';
import { Store } from '../store.js';
import { loadConfig } from '../config.js';

function fixture(t) {
  const id = -1001234567890, store = new Store(':memory:');
  const user = n => ({ id: n, is_bot: n === 9, first_name: 'Fixture' });
  const bot = new Bot('9:offline_test_only', { botInfo: { ...user(9), username: 'custom_owner_bot',
    can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: false } });
  const config = { ...loadConfig({}, { requireToken: false }), mtAllowedChats: new Set([String(id)]) };
  const state = { humanAdmin: true, botAdmin: true, type: 'channel', fail: false }, calls = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload });
    if (state.fail && method === 'getChatMember') return { ok: false, error_code: 403, description: 'Denied' };
    let result = true;
    if (method === 'getChat') result = { id, type: state.type, title: 'Channel fixture' };
    if (method === 'getChatMember') result = { user: user(payload.user_id),
      status: (payload.user_id === 9 ? state.botAdmin : state.humanAdmin) ? 'administrator' : 'member' };
    if (method === 'sendMessage') result = { message_id: calls.length, date: 1, chat: { id: 1, type: 'private' }, text: payload.text };
    return { ok: true, result };
  });
  const app = createApplication(config, { bot, store, budget: { allow: () => true, pause() {} } });
  let update = 1;
  const command = async (text, type = 'private') => {
    store.db.prepare('DELETE FROM cooldowns').run();
    const message = { message_id: update, date: Math.floor(Date.now() / 1000), from: user(1),
      chat: { id: type === 'private' ? 1 : id, type }, text,
      entities: [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }] };
    await bot.handleUpdate(type === 'channel' ? { update_id: update++, channel_post: message } : { update_id: update++, message });
  };
  t.after(async () => { await app.queue.drain(); store.close(); });
  return { ...app, id, state, calls, command, last: () => calls.filter(c => c.method === 'sendMessage').at(-1)?.payload.text };
}

test('channel enrollment is private, fresh-admin verified and does not require supergroup restriction rights', async t => {
  const f = fixture(t);
  await f.command('/channel @fixture setup', 'channel'); assert.equal(f.store.group(f.id), null);
  await f.command('/channel @fixture setup', 'supergroup'); assert.equal(f.store.group(f.id), null);
  f.state.humanAdmin = false;
  await f.command('/channel @fixture setup'); assert.equal(f.store.group(f.id), null);
  f.state.humanAdmin = true; f.state.botAdmin = false;
  await f.command('/channel @fixture setup'); assert.equal(f.store.group(f.id), null);
  f.state.botAdmin = true;
  await f.command('/channel @fixture setup');
  assert.deepEqual(f.store.group(f.id), { mode: 'observe', vc: false, vcLock: false, chatType: 'channel', gate: false });
  assert.ok(f.calls.filter(c => c.method === 'sendMessage').every(c => c.payload.chat_id === 1));
});

test('channel controls require opt-in and allowlisting; loss of rights or lookup errors cannot change settings', async t => {
  const f = fixture(t); await f.command('/channel @fixture setup');
  await f.command('/channel @fixture vc on'); assert.equal(f.store.group(f.id).vc, false);
  f.engine.vc = { requestRefresh() {}, dropChat() {}, capability: () => 'call-state monitoring' };
  f.config.mtAllowedChats.clear();
  await f.command('/channel @fixture vc on'); assert.equal(f.store.group(f.id).vc, false);
  f.config.mtAllowedChats.add(String(f.id));
  await f.command(`/channel ${f.id} vc on`); assert.equal(f.store.group(f.id).vc, true);
  await f.command('/channel @fixture mode enforce'); assert.equal(f.store.group(f.id).mode, 'enforce');
  f.state.humanAdmin = false;
  await f.command('/channel @fixture disable'); assert.ok(f.store.group(f.id));
  await f.command('/channel @fixture mode observe'); assert.equal(f.store.group(f.id).mode, 'enforce');
  f.state.humanAdmin = true; f.state.fail = true;
  await f.command('/channel @fixture disable'); assert.ok(f.store.group(f.id));
  f.state.fail = false;
  await f.command('/channel @fixture disable'); assert.equal(f.store.group(f.id), null);
});

test('subscriber events cannot trigger chat CAPTCHA and incident output stays scoped to the verified channel', async t => {
  const f = fixture(t); await f.command('/channel @fixture setup');
  f.store.setGroup(f.id, { chatType: 'channel', mode: 'enforce', gate: true, vc: true });
  for (let i = 0; i < 30; i++) await f.engine.process({ chatId: f.id, userId: 2, kind: 'join' });
  assert.equal(await f.engine.gate(f.id, 2, 'join-gate'), false);
  assert.equal(f.calls.filter(c => c.method === 'restrictChatMember').length, 0);
  assert.equal(f.engine.flood.users.size, 0);
  f.store.audit(f.id, 2, 'detect'); f.store.audit(-10099999, 999, 'detect');
  await f.command('/channel @fixture incidents'); assert.match(f.last(), /detect \| 2/); assert.doesNotMatch(f.last(), /999/);
  f.state.type = 'supergroup';
  await f.command('/channel @fixture mode observe'); assert.equal(f.store.group(f.id).mode, 'enforce');
});
