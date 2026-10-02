export const counters = { events: 0, detections: 0, restrictions: 0, vcMutes: 0, observed: 0,
  failures: 0, budgetDrops: 0, queueDrops: 0 };

// Error objects from HTTP/MTProto clients can contain credentials or message bodies.
export function log(event, fields = {}) {
  console.log(JSON.stringify({ at: new Date().toISOString(), event, ...fields }));
}
export function logError(event, error) {
  counters.failures++;
  log(event, { code: Number(error?.error_code) || Number(error?.code) || 0,
    type: /^[A-Za-z][A-Za-z0-9_]{0,60}$/.test(error?.name || '') ? error.name : 'Error' });
}

export class SerialQueue {
  constructor(limit = 2000) { this.tail = Promise.resolve(); this.pending = 0; this.limit = limit; this.closed = false; }
  run(task) {
    if (this.closed) return Promise.resolve(false);
    if (this.pending >= this.limit) { counters.queueDrops++; return Promise.resolve(false); }
    this.pending++;
    const result = this.tail.then(() => this.closed ? false : task());
    this.tail = result.catch(() => {}).finally(() => { this.pending--; });
    return result;
  }
  drain() { return this.tail; }
  close() { this.closed = true; }
}

export class ActionBudget {
  constructor(clock = () => Date.now()) { this.clock = clock; this.tokens = 20; this.last = clock(); this.chats = new Map(); this.pauseUntil = 0; }
  allow(chatId) {
    const now = this.clock();
    if (now < this.pauseUntil) return false;
    this.tokens = Math.min(20, this.tokens + Math.max(0, now - this.last) * 5 / 1000);
    this.last = now;
    let entry = this.chats.get(String(chatId)) || { tokens: 5, last: now };
    entry.tokens = Math.min(5, entry.tokens + Math.max(0, now - entry.last) / 1000);
    entry.last = now;
    this.chats.delete(String(chatId));
    this.chats.set(String(chatId), entry);
    if (this.chats.size > 10000) this.chats.delete(this.chats.keys().next().value);
    if (this.tokens < 1 || entry.tokens < 1) { counters.budgetDrops++; return false; }
    this.tokens--; entry.tokens--;
    return true;
  }
  pause(error) {
    const seconds = error?.parameters?.retry_after || error?.seconds || 0;
    if (Number.isFinite(seconds) && seconds > 0)
      this.pauseUntil = Math.max(this.pauseUntil, this.clock() + Math.min(seconds, 86400) * 1000);
  }
}
