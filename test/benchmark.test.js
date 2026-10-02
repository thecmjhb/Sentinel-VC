import test from 'node:test';
import assert from 'node:assert/strict';
import { rng, scenarios, trace, wilson } from '../benchmarks/benchmark.js';

test('paired benchmark models receive the same reproducible scenario traces', () => {
  assert.deepEqual(trace(scenarios[0], rng(1)), trace(scenarios[0], rng(1)));
  assert.notDeepEqual(trace(scenarios[0], rng(1)), trace(scenarios[0], rng(2)));
});
test('unobservable media flood is intentionally indistinguishable from ordinary bot events', () => {
  assert.deepEqual(trace(scenarios[0], rng(1)), trace(scenarios.find(x => x.name === 'unobservable_media_flood'), rng(1)));
});
test('Wilson interval includes uncertainty at a perfect or zero observed rate', () => {
  assert.ok(wilson(100, 100)[0] < 1); assert.ok(wilson(0, 100)[1] > 0);
});
