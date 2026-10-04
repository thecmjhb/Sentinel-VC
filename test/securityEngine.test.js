import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../store.js';
import { SecurityEngine, permissionSet } from '../securityEngine.js';
import { loadConfig } from '../config.js';

function fixture(t, mode = 'enforce') {
  const config = loadConfig({}, { requireToken: false });
  const store = new Store(':memory:'); t.after(() => store.close());
  store.setGroup(-1001, { mode, gate: false, vc: false });
  const calls = [];
  let member = { status: 'member', user: { id: 1, is_bot: false } };
  const api = {
    getChatMember: async () => member,
    restrictChatMember: async (chatId, userId, permissions, options) => {
      calls.push({ chatId, userId, permissions, options });
      member = permissions.can_send_messages ? { status: 'member', user: { id: userId } } :
        { status: 'restricted', is_member: true, user: { id: userId }, ...permissions, until_date: options.until_date };
      return true;
    },
    sendMessage: async () => ({ message_id: 1 })
  };
  const engine = new SecurityEngine({ config, store, api, clock: () => 100000, budget: { allow: () => true, pause() {} } });
  return { engine, store, api, calls, setMember: value => { member = value; } };
}
const burst = async engine => { for (let i = 0; i < 30; i++) await engine.process({ chatId: -1001, userId: 1, kind: 'message' }); };

test('pre-upgrade numeric-answer gates still restore only the matching owned restriction', async t => {
  const f = fixture(t); const until = Math.floor(Date.now()/1000)+120;
  f.store.setGate(-1001,1,{token:'a'.repeat(24),question:'2 + 3 = ?',answer:5,options:[4,5,6,7],attempts:0,until});
  f.setMember({status:'restricted',is_member:true,until_date:until,...permissionSet(false)});
  assert.equal(await f.engine.showGate(-1001,1),true);
  assert.match(await f.engine.verify(-1001,1,'a'.repeat(24),'5'), /restored/);
  assert.equal(f.store.gate(-1001,1),null);
});
test('observe mode records detections without any mutation', async t => {
  const { engine, calls } = fixture(t, 'observe'); await burst(engine); assert.equal(calls.length, 0);
});
test('sustained flood creates only one bounded temporary restriction', async t => {
  const { engine, calls, store } = fixture(t); await burst(engine);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].options.until_date * 1000 > Date.now() + 30000);
  assert.ok(store.gate(-1001, 1));
});

test('an expired persisted challenge does not block a new join gate before cleanup', async t => {
  const { engine, store, calls } = fixture(t);
  store.setGate(-1001, 1, { token: 'expired', until: 1 });
  assert.equal(await engine.gate(-1001, 1, 'join-gate'), true);
  assert.equal(calls.length, 1);
  assert.notEqual(store.gate(-1001, 1).token, 'expired');
});
test('unenrolled groups and bot accounts cannot trigger actions', async t => {
  const { engine, calls } = fixture(t);
  for (let i = 0; i < 50; i++) {
    await engine.process({ chatId: -1002, userId: 1, kind: 'message' });
    await engine.process({ chatId: -1001, userId: 1, kind: 'message', isBot: true });
  }
  assert.equal(calls.length, 0);
});
test('administrators and existing third-party restrictions are preserved', async t => {
  const f = fixture(t);
  for (const status of ['creator', 'administrator', 'restricted', 'left', 'kicked']) {
    f.setMember({ status, is_member: true, user: { id: 1 } });
    assert.equal(await f.engine.gate(-1001, 1, 'test'), false);
  }
  assert.equal(f.calls.length, 0);
});
test('challenge is bound to both user and tenant and expires', async t => {
  const { engine, store, calls } = fixture(t);
  await engine.gate(-1001, 1, 'test');
  const gate = store.gate(-1001, 1);
  assert.equal(await engine.verify(-1001, 2, gate.token, gate.answer), 'Challenge expired.');
  assert.equal(await engine.verify(-1002, 1, gate.token, gate.answer), 'Challenge expired.');
  gate.until = 1; store.setGate(-1001, 1, gate);
  assert.equal(await engine.verify(-1001, 1, gate.token, gate.answer), 'Challenge expired.');
  assert.equal(calls.length, 1);
});
test('correct answer restores only an unchanged bot-owned restriction', async t => {
  const { engine, store, calls } = fixture(t);
  await engine.gate(-1001, 1, 'test'); const gate = store.gate(-1001, 1);
  assert.equal(await engine.verify(-1001, 1, gate.token, gate.answer), 'Verified. Chat permissions restored.');
  assert.equal(calls.length, 2); assert.equal(store.gate(-1001, 1), null);
});
test('moderator changes block restoration and never grant a broader permission set', async t => {
  const { engine, store, calls, setMember } = fixture(t);
  await engine.gate(-1001, 1, 'test'); const gate = store.gate(-1001, 1);
  setMember({ status: 'restricted', is_member: true, ...permissionSet(false), until_date: gate.until + 1 });
  assert.match(await engine.verify(-1001, 1, gate.token, gate.answer), /Permissions changed/);
  assert.equal(calls.length, 1);
});
test('wrong answers consume a durable three-attempt limit', async t => {
  const { engine, store } = fixture(t);
  await engine.gate(-1001, 1, 'test'); const gate = store.gate(-1001, 1);
  for (let i = 0; i < 3; i++) assert.equal(await engine.verify(-1001, 1, gate.token, -1), 'Incorrect answer.');
  assert.match(await engine.verify(-1001, 1, gate.token, gate.answer), /Attempt limit/);
});
test('a solved flood challenge cannot bypass the first-minute action cooldown', async t => {
  const { engine, store, calls } = fixture(t);
  await engine.gate(-1001, 1, 'flood'); const gate = store.gate(-1001, 1);
  assert.match(await engine.verify(-1001, 1, gate.token, gate.answer), /Flood cooldown/);
  assert.equal(calls.length, 1); assert.equal(store.gate(-1001, 1).attempts, 0);
});
test('a lost API acknowledgement leaves persistent bounded intent', async t => {
  const { engine, store, api } = fixture(t);
  api.restrictChatMember = async () => { throw new Error('lost acknowledgement'); };
  assert.equal(await engine.gate(-1001, 1, 'test'), false);
  assert.equal(store.gate(-1001, 1).phase, 'pending');
  assert.ok(store.gate(-1001, 1).until > Date.now() / 1000);
});
test('VC opt-in is mandatory and CAPTCHA never calls the voice adapter', async t => {
  const { engine, store } = fixture(t); let vcCalls = 0;
  engine.vc = { mitigate: async () => { vcCalls++; } };
  for (let i = 0; i < 10; i++) await engine.process({ chatId: -1001, userId: 1, kind: 'vc_join' });
  assert.equal(vcCalls, 0);
  store.setGroup(-1001, { mode: 'enforce', gate: false, vc: true });
  for (let i = 0; i < 10; i++) await engine.process({ chatId: -1001, userId: 1, kind: 'vc_join' });
  assert.equal(vcCalls, 1);
});
test('enrollment requires current human-admin authority and bot restrict rights', async t => {
  const { engine, api, store } = fixture(t);
  api.getChatMember = async (chatId, userId) => userId === 1 ? { status: 'member' } : { status: 'administrator', can_restrict_members: true };
  assert.equal(await engine.enroll(-1002, 1, 9), false); assert.equal(store.group(-1002), null);
  api.getChatMember = async (chatId, userId) => userId === 1 ? { status: 'administrator' } : { status: 'administrator', can_restrict_members: false };
  await assert.rejects(() => engine.enroll(-1002, 1, 9), /restrict-members/);
  assert.equal(store.group(-1002), null);
});
