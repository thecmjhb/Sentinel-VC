import test from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from 'grammy';
import { createApplication } from '../index.js';
import { loadConfig } from '../config.js';
import { Store } from '../store.js';

const chat = { id: -1001001, type: 'supergroup', title: 'Private fixture' };
const user = id => ({ id, is_bot: false, first_name: 'Fixture' });
function fixture(t) {
  const store = new Store(':memory:');
  const config = loadConfig({}, { requireToken: false });
  const bot = new Bot('9:local_test_token_never_sent', { botInfo: { ...user(9), is_bot: true, username: 'sentinel_fixture',
    can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: false } });
  const calls = [], members = new Map([[1, { status: 'administrator', user: user(1) }],
    [9, { status: 'administrator', can_restrict_members: true, user: user(9) }]]);
  bot.api.config.use(async (previous, method, payload) => {
    calls.push({ method, payload });
    let result = true;
    if (method === 'getChat') result = chat;
    if (method === 'getChatMember') result = members.get(payload.user_id) || { status: 'member', user: user(payload.user_id) };
    if (method === 'sendMessage') result = { message_id: calls.length, date: Math.floor(Date.now() / 1000), chat, text: payload.text };
    if (method === 'restrictChatMember') members.set(payload.user_id, payload.permissions.can_send_messages ?
      { status: 'member', user: user(payload.user_id) } : { status: 'restricted', is_member: true,
        user: user(payload.user_id), ...payload.permissions, until_date: payload.until_date });
    return { ok: true, result };
  });
  const app = createApplication(config, { store, bot, budget: { allow: () => true, pause() {} } });
  t.after(async () => { await app.queue.drain(); store.close(); });
  let nextId = 1;
  const command = async (text, id = 1, options = {}) => {
    if (!text.startsWith('/verify')) { const [name, ...args] = text.split(' '); text = [name, String(chat.id), ...args].join(' '); }
    store.db.prepare("DELETE FROM cooldowns").run();
    const message = { message_id: nextId, date: Math.floor(Date.now() / 1000), chat: { id, type: 'private' }, from: user(id), text,
      entities: [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }], ...options };
    await bot.handleUpdate({ update_id: nextId++, message });
  };
  return { ...app, calls, members, command };
}
test('actual grammY command routing enforces tenant enrollment and administrator ownership', async t => {
  const f = fixture(t);
  await f.command('/setup', 2); assert.equal(f.store.group(chat.id), null);
  await f.command('/setup'); assert.equal(f.store.group(chat.id).mode, 'observe');
  await f.command('/mode enforce', 2); assert.equal(f.store.group(chat.id).mode, 'observe');
  await f.command('/mode enforce'); assert.equal(f.store.group(chat.id).mode, 'enforce');
  await f.command('/gate on'); assert.equal(f.store.group(chat.id).gate, true);
  await f.command('/vc on'); assert.equal(f.store.group(chat.id).vc, false);
  await f.command('/disable', 2); assert.ok(f.store.group(chat.id));
  await f.command('/disable'); assert.equal(f.store.group(chat.id), null);
});
test('anonymous administrators and basic groups cannot enroll a tenant', async t => {
  const f = fixture(t);
  await f.command('/setup', 1, { sender_chat: chat }); assert.equal(f.store.group(chat.id), null);
  await f.command('/setup', 1, { chat: { ...chat, type: 'group' } }); assert.equal(f.store.group(chat.id), null);
});
test('actual grammY membership update produces one gate and replay/stale updates are suppressed', async t => {
  const f = fixture(t);
  f.store.setGroup(chat.id, { mode: 'enforce', gate: true, vc: false });
  const update = { update_id: 100, chat_member: { chat, from: user(1), date: Math.floor(Date.now() / 1000),
    old_chat_member: { status: 'left', user: user(2) }, new_chat_member: { status: 'member', user: user(2) } } };
  await f.bot.handleUpdate(update); await f.bot.handleUpdate(update);
  assert.equal(f.calls.filter(c => c.method === 'restrictChatMember').length, 1);
  await f.bot.handleUpdate({ ...update, update_id: 101, chat_member: { ...update.chat_member, date: 1,
    new_chat_member: { status: 'member', user: user(3) } } });
  assert.equal(f.store.gate(chat.id, 3), null);
});
test('a restricted user can recover and solve only their own challenge in a private chat', async t => {
  const f = fixture(t); f.store.setGroup(chat.id, { mode: 'enforce', gate: true, vc: false });
  await f.engine.gate(chat.id, 2, 'join-gate');
  const gate = f.store.gate(chat.id, 2);
  await f.command(`/verify ${chat.id}`, 2, { chat: { id: 2, type: 'private', first_name: 'Fixture' } });
  const privatePrompt = f.calls.find(c => c.method === 'sendMessage' && c.payload.chat_id === 2);
  assert.ok(privatePrompt); assert.match(privatePrompt.payload.reply_markup.inline_keyboard[0][0].callback_data, /^sv:-1001001:/);
  const data = `sv:${chat.id}:${gate.token}:${gate.answer}`;
  await f.bot.handleUpdate({ update_id: 200, callback_query: { id: 'forged', from: user(3), chat_instance: '1', data,
    message: { message_id: 1, date: 1, chat: { id: 3, type: 'private', first_name: 'Fixture' } } } });
  assert.ok(f.store.gate(chat.id, 2));
  await f.bot.handleUpdate({ update_id: 201, callback_query: { id: 'valid', from: user(2), chat_instance: '1', data,
    message: { message_id: 1, date: 1, chat: { id: 2, type: 'private', first_name: 'Fixture' } } } });
  assert.equal(f.store.gate(chat.id, 2), null);
});
test('voice invitation service messages are not counted as actual call joins', async t => {
  const f = fixture(t); f.store.setGroup(chat.id, { mode: 'enforce', gate: false, vc: true });
  await f.bot.handleUpdate({ update_id: 300, message: { message_id: 1, date: Math.floor(Date.now() / 1000), chat,
    from: user(2), video_chat_participants_invited: { users: [user(3)] } } });
  assert.equal(f.engine.flood.users.size, 0); assert.equal(f.calls.length, 0);
});

test('setup gives a recoverable explanation when the bot lacks restriction rights', async t => {
  const f = fixture(t);
  f.members.set(9, { status: 'administrator', can_restrict_members: false, user: user(9) });
  await f.command('/setup');
  assert.equal(f.store.group(chat.id), null);
  assert.match(f.calls.find(x => x.method === 'sendMessage').payload.text, /Restrict Members/);
});

test('doctor works before enrollment and incidents are admin-only and tenant-scoped', async t => {
  const f = fixture(t);
  await f.command('/doctor');
  assert.match(f.calls.at(-1).payload.text, /Not configured/);
  f.store.setGroup(chat.id, { mode: 'observe', gate: false, vc: false });
  f.store.audit(chat.id, 2, 'detect');
  f.store.audit(-1009999, 777, 'detect');
  f.calls.length = 0;
  await f.command('/incidents', 2);
  assert.doesNotMatch(f.calls.at(-1).payload.text, /detect/);
  await f.command('/incidents');
  assert.match(f.calls.at(-1).payload.text, /detect \| 2/);
  assert.doesNotMatch(f.calls.at(-1).payload.text, /777/);
  assert.throws(() => f.store.incidents(chat.id, 1000), RangeError);
});
