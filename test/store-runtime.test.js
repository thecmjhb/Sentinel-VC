import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Store } from '../store.js';
import { ActionBudget, SerialQueue } from '../runtime.js';
import { loadConfig } from '../config.js';
import { createHttpServer, equalSecret } from '../httpServer.js';

test('settings, challenge ownership, and cooldowns survive restart', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'sentinel-test-'));
  try {
    let store = new Store(dir);
    store.setGroup(1, { mode: 'observe' }); store.setGate(1, 1, { token: 'secret', until: 9999999999 });
    assert.equal(store.claim('action', 1000, 100), true); store.mark(5); store.close();
    store = new Store(dir);
    assert.equal(store.group(1).mode, 'observe'); assert.equal(store.gate(1, 1).token, 'secret');
    assert.equal(store.claim('action', 1000, 200), false); assert.equal(store.seen(5), true);
    assert.equal(store.claim('action', 1000, 1100), true); store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('retention deletes expired challenges, update IDs, and audit rows', () => {
  const store = new Store(':memory:');
  try {
    store.setGate(1, 1, { until: 1 }); store.db.prepare('INSERT INTO audit(at,action,detail) VALUES(1,?,?)').run('old', '{}');
    store.db.prepare('INSERT INTO updates VALUES(1,1)').run(); store.prune(7);
    assert.equal(store.gate(1, 1), null); assert.equal(store.seen(1), false);
    assert.equal(store.db.prepare('SELECT count(*) AS n FROM audit').get().n, 0);
  } finally { store.close(); }
});
test('action budget honors retry_after and isolates group exhaustion', () => {
  let now = 10000; const budget = new ActionBudget(() => now);
  for (let i = 0; i < 5; i++) assert.equal(budget.allow(1), true);
  assert.equal(budget.allow(1), false); assert.equal(budget.allow(2), true);
  budget.pause({ parameters: { retry_after: 3 } });
  now += 2000; assert.equal(budget.allow(2), false);
  now += 1000; assert.equal(budget.allow(2), true);
});

test('expired gates and update IDs stop applying before periodic cleanup', () => {
  const store = new Store(':memory:');
  try {
    store.setGate(1, 2, { token: 'old', until: 1 });
    store.db.prepare('INSERT INTO updates VALUES(1,1)').run();
    assert.equal(store.gate(1, 2), null);
    assert.equal(store.seen(1), false);
    store.mark(1); assert.equal(store.seen(1), true);
    store.setGate(1, 2, { token: 'new', until: Math.floor(Date.now() / 1000) + 120 });
    assert.equal(store.gate(1, 2).token, 'new');
  } finally { store.close(); }
});

test('opening a newer database refuses downgrade and preserves its version', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'sentinel-test-schema-'));
  try {
    let db = new DatabaseSync(path.join(dir, 'sentinel.db'));
    db.exec('PRAGMA user_version=2'); db.close();
    assert.throws(() => new Store(dir), /Unsupported database schema version 2/);
    db = new DatabaseSync(path.join(dir, 'sentinel.db'));
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 2); db.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a shorter subsequent rate-limit response cannot shorten the current pause', () => {
  let now = 1000; const budget = new ActionBudget(() => now);
  budget.pause({ parameters: { retry_after: 60 } });
  now += 1000; budget.pause({ seconds: 1 });
  now = 60000; assert.equal(budget.allow(1), false);
  now = 61000; assert.equal(budget.allow(1), true);
});
test('bounded serial queue preserves order, recovers from exceptions, and sheds load', async () => {
  const queue = new SerialQueue(2), order = [];
  const a = queue.run(async () => { order.push(1); throw new Error('task'); });
  const b = queue.run(() => order.push(2));
  assert.equal(await queue.run(() => order.push(3)), false);
  await assert.rejects(a); await b; await queue.drain();
  assert.deepEqual(order, [1, 2]); assert.equal(queue.pending, 0);
});
test('shutdown completes the active task and cancels pending and new queue work', async () => {
  const queue = new SerialQueue(); const order = []; let release;
  const started = new Promise(resolve => { release = resolve; });
  const active = queue.run(async () => { order.push(1); await started; order.push(2); });
  await Promise.resolve();
  const pending = queue.run(() => order.push(3)); queue.close(); release();
  await active; assert.equal(await pending, false);
  assert.equal(await queue.run(() => order.push(4)), false); await queue.drain();
  assert.deepEqual(order, [1, 2]);
});
test('invalid secrets, bounds, and MTProto configuration fail before networking', () => {
  assert.throws(() => loadConfig({ BOT_TOKEN: 'bad' }), /BOT_TOKEN/);
  assert.throws(() => loadConfig({ HTTP_PORT: '-1' }, { requireToken: false }), /HTTP_PORT/);
  assert.throws(() => loadConfig({ METRICS_TOKEN: 'short' }, { requireToken: false }), /METRICS_TOKEN/);
  assert.throws(() => loadConfig({ MT_ENABLED: 'true' }, { requireToken: false }), /MT_ENABLED/);
  assert.equal(equalSecret('one', 'two'), false); assert.equal(equalSecret('one', 'one'), true);
  assert.equal(equalSecret(undefined, 'one'), false);
});
test('health/readiness are distinct and metrics require a bearer secret', async t => {
  const config = { metricsToken: 'a'.repeat(32) }; const status = { ready: false };
  const server = createHttpServer(config, status);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.equal((await fetch(`${base}/readyz`)).status, 503);
  status.ready = true; assert.equal((await fetch(`${base}/readyz`)).status, 200);
  assert.equal((await fetch(`${base}/metrics`)).status, 401);
  const response = await fetch(`${base}/metrics`, { headers: { Authorization: `Bearer ${config.metricsToken}` } });
  assert.equal(response.status, 200); assert.match(await response.text(), /sentinel_events_total/);
  assert.equal((await fetch(`${base}/metrics`, { method: 'POST' })).status, 405);
});
