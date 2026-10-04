import { randomInt } from 'node:crypto';

// Varied, per-challenge friction, not a claim of bot-proof human verification.
export function createChallenge(kind = randomInt(6)) {
  const a = randomInt(3, 40), b = randomInt(2, 12);
  let question, answer;
  if (kind === 0) { question = `${a} + ${b} = ?`; answer = a + b; }
  else if (kind === 1) { question = `${a + b} - ${b} = ?`; answer = a; }
  else if (kind === 2) { const c = randomInt(2, 10); question = `${b} × ${c} = ?`; answer = b * c; }
  else if (kind === 3) { question = `? + ${b} = ${a + b}`; answer = a; }
  else if (kind === 4 || kind === 5) {
    const values = new Set([a]); while (values.size < 4) values.add(randomInt(2, 90));
    const numbers = [...values];
    question = `${kind === 4 ? 'Largest / সবচেয়ে বড়' : 'Smallest / সবচেয়ে ছোট'}: ${numbers.join(', ')}`;
    answer = kind === 4 ? Math.max(...numbers) : Math.min(...numbers);
  } else throw new RangeError('Unknown challenge kind');
  const choices = new Set([answer]);
  while (choices.size < 4) choices.add(answer + randomInt(-9, 10));
  const values = [...choices];
  for (let i = values.length - 1; i > 0; i--) { const j = randomInt(i + 1); [values[i], values[j]] = [values[j], values[i]]; }
  // Opaque option IDs: callback data does not contain the solution or encode its value.
  return { kind, question, options: values.map((value, i) => ({ id: String(i), label: String(value) })), answer: String(values.indexOf(answer)) };
}
