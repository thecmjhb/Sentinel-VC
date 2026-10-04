// Aggregate delivered call-state events; no inference of packets, audio loss or identity age.
export class VoiceBurstDetector {
  constructor(config, clock = () => Date.now()) {
    this.config = config; this.clock = clock; this.calls = new Map();
  }
  forget(callId) { this.calls.delete(String(callId)); }
  observe(callId, { userId, kind }) {
    if (!['vc_join', 'vc_leave'].includes(kind)) return null;
    const now = this.clock(), windowMs = this.config.vcRaidWindowSeconds * 1000;
    const key = String(callId);
    let s = this.calls.get(key);
    if (!s || now - s.last > windowMs * 12) {
      s = { joins: new Map(), transitions: [], head: 0, last: now, bin: Math.floor(now / windowMs), binUsers: new Set(), mean: 0, variance: 0 };
      this.calls.delete(key); this.calls.set(key, s);
      if (this.calls.size > this.config.maxGroups) this.calls.delete(this.calls.keys().next().value);
    }
    const bin = Math.floor(now / windowMs);
    if (bin > s.bin) {
      const count = s.binUsers.size;
      // Freeze anomalously large bins instead of teaching the baseline to accept a raid.
      if (count < this.threshold(s)) {
        const delta = count - s.mean;
        s.mean += 0.15 * delta; s.variance = 0.85 * (s.variance + 0.15 * delta * delta);
      }
      // Empty intervening bins decay history; constant-time even after long idle periods.
      const decay = Math.pow(0.85, Math.min(100, bin - s.bin - 1));
      s.mean *= decay; s.variance *= decay; s.bin = bin; s.binUsers.clear();
    }
    s.last = now;
    // Join map is ordered by last observation; eviction work is amortized, not a full scan per event.
    for (const [id, at] of s.joins) { if (now - at >= windowMs) s.joins.delete(id); else break; }
    while (s.head < s.transitions.length && now - s.transitions[s.head] >= windowMs) s.head++;
    if (s.head > 4096 || s.head > s.transitions.length / 2) { s.transitions = s.transitions.slice(s.head); s.head = 0; }
    const limit = Math.min(this.config.maxUsers, 10000);
    if (kind === 'vc_join') {
      s.joins.delete(String(userId)); s.joins.set(String(userId), now);
      if (s.joins.size > limit) s.joins.delete(s.joins.keys().next().value);
      if (s.binUsers.size < limit) s.binUsers.add(String(userId));
    }
    if (s.transitions.length - s.head < limit) s.transitions.push(now);
    const threshold = this.threshold(s);
    return { suspicious: s.joins.size >= threshold, uniqueJoins: s.joins.size,
      transitions: s.transitions.length - s.head, threshold, windowSeconds: this.config.vcRaidWindowSeconds,
      baseline: Number(s.mean.toFixed(3)), at: now };
  }
  threshold(s) {
    return Math.max(this.config.vcRaidUniqueJoins, Math.ceil(s.mean * this.config.vcRaidBaselineMultiplier),
      Math.ceil(s.mean + 4 * Math.sqrt(s.variance)));
  }
}
