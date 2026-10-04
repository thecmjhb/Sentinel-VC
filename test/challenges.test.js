import test from 'node:test';
import assert from 'node:assert/strict';
import { createChallenge } from '../challenges.js';
test('all six random challenge families have four distinct choices and a mathematically correct answer', () => {
  for (let kind = 0; kind < 6; kind++) for (let i = 0; i < 30; i++) {
    const c = createChallenge(kind), ns = c.question.match(/\d+/g).map(Number);
    const expected = [() => ns[0]+ns[1], () => ns[0]-ns[1], () => ns[0]*ns[1], () => ns[1]-ns[0], () => Math.max(...ns), () => Math.min(...ns)][kind]();
    assert.equal(c.options.length, 4); assert.equal(new Set(c.options.map(x => x.label)).size, 4);
    assert.equal(Number(c.options.find(x => x.id === c.answer).label), expected);
    assert.deepEqual(c.options.map(x=>x.id), ['0','1','2','3']);
  }
  assert.throws(() => createChallenge(6), RangeError);
});
