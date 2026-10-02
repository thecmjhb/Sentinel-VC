import test from 'node:test';
import assert from 'node:assert/strict';
import { AntiFlood } from '../antiFlood.js';
import { loadConfig } from '../config.js';

const config = loadConfig({}, { requireToken: false });
function fixture(overrides = {}) {
  let now = 100000;
  return { flood: new AntiFlood({ ...config, ...overrides }, () => now), advance: ms => { now += ms; } };
}
test('normal conversation and username absence alone never trigger mitigation', () => {
  const { flood, advance } = fixture();
  for (let i = 0; i < 100; i++) {
    assert.equal(flood.observe({ chatId: 1, userId: 1, kind: 'message', username: '' }).attack, false);
    advance(2000);
  }
});
test('sustained rapid messages and repeated call churn are detected', () => {
  for (const kind of ['message', 'vc_join']) {
    const { flood, advance } = fixture();
    let detected = false;
    for (let i = 0; i < 30; i++) {
      detected ||= flood.observe({ chatId: 1, userId: 1, kind }).attack;
      advance(50);
    }
    assert.equal(detected, true);
  }
});
test('a group-wide burst cannot punish a user with no individual exceedances', () => {
  const { flood } = fixture();
  for (let i = 0; i < 200; i++) {
    const result = flood.observe({ chatId: 1, userId: i, kind: 'join', username: '' });
    assert.equal(result.attack, false);
  }
});
test('the same user is isolated across tenants and event classes', () => {
  const { flood } = fixture();
  for (let i = 0; i < 50; i++) flood.observe({ chatId: 1, userId: 1, kind: 'message' });
  assert.equal(flood.observe({ chatId: 2, userId: 1, kind: 'message' }).attack, false);
  assert.equal(flood.observe({ chatId: 1, userId: 1, kind: 'vc_join' }).attack, false);
});
test('idle expiry and refill recover without retaining stale strikes', () => {
  const { flood, advance } = fixture();
  for (let i = 0; i < 100; i++) flood.observe({ chatId: 1, userId: 1, kind: 'message' });
  advance(config.ttlMs + 1);
  assert.equal(flood.observe({ chatId: 1, userId: 1, kind: 'message' }).attack, false);
  advance(config.ttlMs + 1); flood.sweep();
  assert.equal(flood.users.size, 0);
});
test('high-cardinality traffic is memory bounded', () => {
  const { flood } = fixture({ maxUsers: 100, maxGroups: 10 });
  for (let i = 0; i < 10000; i++) flood.observe({ chatId: i, userId: i, kind: 'join' });
  assert.ok(flood.users.size <= 100);
  assert.ok(flood.chats.size <= 10);
  assert.ok(flood.joins.size <= 100);
  assert.ok(flood.evictions > 0);
});
test('unsupported packet labels are rejected, not interpreted as packet telemetry', () => {
  const { flood } = fixture();
  for (const kind of ['udp_packet', 'constructor', '__proto__', 'toString'])
    assert.throws(() => flood.observe({ chatId: 1, userId: 1, kind }), /Unsupported/);
});
test('unavailable account creation date cannot alter the score', () => {
  const a = fixture().flood, b = fixture().flood;
  assert.deepEqual(a.observe({ chatId: 1, userId: 1, kind: 'join', accountAgeDays: 1 }),
    b.observe({ chatId: 1, userId: 1, kind: 'join', accountAgeDays: 10000 }));
});
