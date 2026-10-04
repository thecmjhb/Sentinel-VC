import test from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from 'grammy';
import { Store } from '../store.js';
import { createApplication } from '../index.js';
import { loadConfig } from '../config.js';

function fixture(t, overrides = {}) {
  const store = new Store(':memory:'), calls = [];
  const user = id => ({ id, first_name: 'Fixture', is_bot: id === 9 });
  const chats = new Map([[-1001, { id: -1001, type: 'supergroup', title: 'Private group' }],
    [-1002, { id: -1002, type: 'channel', title: 'Secret channel' }]]);
  const state = { admin: true, dm: true, members: new Map() };
  const bot = new Bot('9:offline_fixture', { botInfo: { ...user(9), username: 'my_custom_bot',
    can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: false } });
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload }); let result = true;
    if (method === 'getChat') result = chats.get(Number(payload.chat_id));
    if (method === 'getChatMember') result = state.members.get(payload.user_id) || { user: user(payload.user_id),
      status: payload.user_id === 9 || (payload.user_id === 1 && state.admin) ? 'administrator' : 'member', can_restrict_members: true };
    if (method === 'restrictChatMember') state.members.set(payload.user_id, payload.permissions.can_send_messages ?
      { status: 'member', user: user(payload.user_id) } : { status: 'restricted', is_member: true,
        ...payload.permissions, until_date: payload.until_date, user: user(payload.user_id) });
    if (method === 'sendMessage') {
      assert.ok(payload.chat_id > 0, 'never send a community message');
      if (!state.dm) return { ok: false, error_code: 403, description: 'User has not started bot' };
      result = { message_id: calls.length, date: 1, chat: { id: payload.chat_id, type: 'private' }, text: payload.text };
    }
    return { ok: true, result };
  });
  const app = createApplication({...loadConfig({}, { requireToken: false }),...overrides}, { store, bot, budget: { allow: () => true, pause() {} } });
  t.after(async () => { await app.queue.drain(); store.close(); }); let id = 1;
  const send = async update => { store.db.prepare('DELETE FROM cooldowns').run(); await bot.handleUpdate({ update_id: id++, ...update }); };
  const message = (actor = 1) => ({ message_id: id, date: Math.floor(Date.now()/1000), from: user(actor), chat: { id: actor, type: 'private' } });
  const command = (text, actor = 1, chat) => send({ message: { ...message(actor), ...(chat ? {chat} : {}), text,
    entities: [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }] } });
  const click = (data, actor = 1) => send({ callback_query: { id: String(id), from: user(actor), message: message(actor), data, chat_instance: 'fixture' } });
  const promote = (chatId, status = 'administrator') => send({ my_chat_member: { chat: chats.get(chatId), from: user(1), date: Math.floor(Date.now()/1000),
    old_chat_member: { status: 'member', user: user(9) }, new_chat_member: { status, user: user(9) } } });
  return { ...app, state, chats, calls, send, command, click, promote, message,
    last: () => calls.filter(c => c.method === 'sendMessage').at(-1)?.payload };
}
test('promotion discovers a private community silently; names are disclosed only to current linked admins', async t => {
  const f = fixture(t); await f.promote(-1002);
  assert.equal(f.store.communitiesFor(1).length, 1); assert.equal(f.calls.some(c => c.method === 'sendMessage'), false);
  await f.command('/communities'); assert.match(JSON.stringify(f.last()), /Secret channel/);
  await f.command('/communities', 2); assert.doesNotMatch(JSON.stringify(f.last()), /Secret channel/);
  f.state.admin = false; await f.command('/communities'); assert.doesNotMatch(JSON.stringify(f.last()), /Secret channel/);
  assert.equal(f.store.communitiesFor(1).length, 0);
});
test('numeric private channel and group setup, callback ownership and fresh revocation checks', async t => {
  const f = fixture(t);
  await f.command('/community -1001 setup'); await f.command('/community -1002 setup');
  assert.equal(f.store.group(-1001).chatType, 'supergroup'); assert.equal(f.store.group(-1002).chatType, 'channel');
  await f.click('dash:1:-1002:mode_enforce', 2); assert.equal(f.store.group(-1002).mode, 'observe');
  await f.click('dash:1:-1002:mode_enforce'); assert.equal(f.store.group(-1002).mode, 'enforce');
  await f.click('dash:1:-1002:gate_on'); assert.equal(f.store.group(-1002).gate, false);
  f.state.admin = false; await f.click('dash:1:-1002:disable'); assert.ok(f.store.group(-1002));
  f.state.admin = true; await f.promote(-1002, 'left'); assert.equal(f.store.group(-1002), null);
  assert.equal(f.store.communitiesFor(1).some(c => c.id === '-1002'), false);
});
test('Telegram selector accepts private chats, binds expiring request IDs and rechecks actual permissions', async t => {
  const f = fixture(t); await f.click('dash:1:0:add');
  const request = f.last().reply_markup.keyboard[1][0].request_chat;
  assert.equal(request.chat_is_channel, true); assert.equal(request.bot_is_member, true);
  assert.equal(request.chat_has_username, undefined);
  const shared = (request_id, chat_id) => f.send({ message: { ...f.message(), chat_shared: { request_id, chat_id } } });
  await shared(request.request_id + 1, -1002); assert.equal(f.store.communitiesFor(1).length, 0);
  await shared(request.request_id, -1002); assert.equal(f.store.communitiesFor(1).length, 1);
  const before = f.calls.length; await shared(request.request_id, -1002); assert.equal(f.calls.length, before);
  await f.click('dash:1:0:add'); const req2 = f.last().reply_markup.keyboard[0][0].request_chat.request_id;
  f.state.admin = false; await shared(req2, -1001); assert.equal(f.store.communitiesFor(1).some(c => c.id === '-1001'), false);
  f.store.setSelector(1, 10, 20); f.store.db.prepare('UPDATE selectors SET expires=1').run();
  assert.equal(f.store.consumeSelector(1, 10), null);
});
test('all public command paths stay silent; failed DM leaves a bounded privately recoverable challenge', async t => {
  const f = fixture(t);
  for (const name of ['start','help','setup','communities','language','verify','privacy','updates','channel','disable'])
    await f.command('/'+name, 1, f.chats.get(-1001));
  assert.equal(f.calls.some(c => c.method === 'sendMessage'), false);
  f.store.setGroup(-1001, { mode: 'enforce', gate: true, vc: false }); f.state.dm = false;
  assert.equal(await f.engine.gate(-1001, 2, 'join-gate'), true);
  const gate = f.store.gate(-1001,2); assert.ok(gate.until * 1000 > Date.now());
  f.state.dm = true; await f.command('/start', 2);
  assert.ok(f.calls.some(c => c.method === 'sendMessage' && JSON.stringify(c.payload).includes('recover:2:-1001')));
  await f.click('recover:2:-1001', 2); assert.match(f.last().text, /Verification/);
  await f.click(`sv:-1001:${gate.token}:${gate.answer}`, 2); assert.equal(f.store.gate(-1001, 2), null);
  await assert.rejects(f.engine.reply(-1001, 'public'), /private-only/);
});

test('voice shield controls require a configured adapter; emergency action rechecks admin ownership and guard prevents accidental reopen',async t=>{
  const f=fixture(t);await f.command('/community -1002 setup');
  await f.click('dash:1:-1002:vcshield_on');assert.equal(f.store.group(-1002).vcShield,undefined);
  const actions=[];f.config.mtAllowedChats.add('-1002');
  f.engine.vc={capability:()=> 'call-state monitoring',entry:()=>({joinMuted:false}),requestRefresh(){},setAdmission:async(...args)=>actions.push(args)};
  await f.click('dash:1:-1002:vc_on');await f.click('dash:1:-1002:vcshield_on');assert.equal(f.store.group(-1002).vcShield,true);
  await f.click('dash:1:-1002:connect');assert.match(f.last().text,/voice-setup.sh/);
  await f.click('dash:1:-1002:protect',2);assert.equal(actions.length,0);
  await f.click('dash:1:-1002:confirmprotect');assert.equal(actions.length,0);assert.match(f.last().text,/New participants/);
  await f.click('dash:1:-1002:protect');assert.equal(actions[0][1],true);
  await f.click('dash:1:-1002:vcguard_on');await f.click('dash:1:-1002:admit');assert.equal(actions.length,1);
  f.state.admin=false;await f.click('dash:1:-1002:protect');assert.equal(actions.length,1);
});

test('QR launch is private and actor-bound; end-call confirmation is one-shot and cannot terminate a replacement call',async t=>{
  const f=fixture(t,{mtQrEnabled:true}),linked=[],ended=[];
  let callId='77';
  f.engine.vc={allows:()=>true,entry:()=>({call:{id:callId}}),capability:()=> 'monitoring',requestRefresh(){},
    connect:async(...args)=>linked.push(args),endCall:async(_id,_settings,confirmed)=>{
      if(confirmed!==callId)throw new Error('replacement');ended.push(confirmed);
    }};
  await f.command('/community -1002 setup');await f.click('dash:1:-1002:vc_on');
  await f.click('dash:1:-1002:connect');assert.match(f.last().text,/Scan login QR/);
  await f.click('dash:1:-1002:linkaccount',2);assert.equal(linked.length,0);
  await f.click('dash:1:-1002:linkaccount');assert.equal(linked[0][0],1);assert.equal(linked[0][1],-1002);
  await f.click('dash:1:-1002:confirmend');assert.match(f.last().text,/EVERYONE/);
  const end=f.last().reply_markup.inline_keyboard[0][0].callback_data;
  await f.click(end,2);assert.equal(ended.length,0);
  callId='78';await f.click(end);assert.equal(ended.length,0);
  await f.click('dash:1:-1002:confirmend');const current=f.last().reply_markup.inline_keyboard[0][0].callback_data;
  f.state.admin=false;await f.click(current);assert.equal(ended.length,0);
  f.state.admin=true;await f.click('dash:1:-1002:confirmend');const final=f.last().reply_markup.inline_keyboard[0][0].callback_data;
  await f.click(final);assert.deepEqual(ended,['78']);await f.click(final);assert.equal(ended.length,1);
});
