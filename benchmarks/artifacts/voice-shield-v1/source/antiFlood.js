// Bounded, tenant-scoped token buckets. No packet inference from bot messages.
export class AntiFlood {
  constructor(config, clock = () => Date.now()) {
    this.config = config;
    this.clock = clock;
    this.users = new Map();
    this.chats = new Map();
    this.joins = new Map();
    this.evictions = 0;
  }

  prune(map, limit, now) {
    // Maps are refreshed on access; oldest keys are removed first.
    while (map.size) {
      const [key, value] = map.entries().next().value;
      if (map.size < limit && now - value.last < this.config.ttlMs) break;
      map.delete(key);
      this.evictions++;
    }
  }

  take(map, key, capacity, refill, cost, now) {
    let state = map.get(key);
    if (!state || now - state.last >= this.config.ttlMs) {
      this.prune(map, map === this.users ? this.config.maxUsers : this.config.maxGroups, now);
      state = { tokens: capacity, last: now, strikes: 0, strikeAt: now, joinedAt: null, events: 0 };
    }
    const elapsed = Math.max(0, now - state.last);
    state.tokens = Math.min(capacity, state.tokens + elapsed * refill / 1000);
    const exceeded = state.tokens < cost;
    state.tokens = Math.max(0, state.tokens - cost);
    state.strikes = Math.max(0, state.strikes - Math.max(0, now - state.strikeAt) / 10000);
    if (exceeded) state.strikes = Math.min(20, state.strikes + 1);
    state.last = now;
    state.strikeAt = now;
    state.events++;
    map.delete(key);
    map.set(key, state);
    return { exceeded, depletion: 1 - state.tokens / capacity, strikes: state.strikes, state };
  }

  observe({ chatId, userId, kind, username }) {
    const now = this.clock();
    const costs = { message: 1, callback: 1, join: 4, leave: 4, vc_join: 4, vc_leave: 4, vc_action: 2 };
    if (!Object.hasOwn(costs, kind)) throw new Error('Unsupported event kind');
    const prefix = kind.startsWith('vc_') ? 'vc' : kind === 'message' || kind === 'callback' ? 'action' : 'membership';
    const user = this.take(this.users, `${chatId}:${userId}:${prefix}`, prefix === 'vc' ? this.config.vcCapacity : this.config.userCapacity,
      prefix === 'vc' ? this.config.vcRefill : this.config.userRefill, costs[kind], now);
    const chat = this.take(this.chats, `${chatId}:${prefix}`, this.config.chatCapacity,
      this.config.chatRefill, costs[kind], now);
    const joinKey = `${chatId}:${userId}`;
    if (kind === 'join') {
      this.prune(this.joins, this.config.maxUsers, now);
      this.joins.delete(joinKey);
      this.joins.set(joinKey, { last: now });
    }
    if (kind === 'join' || kind === 'vc_join') user.state.joinedAt = now;
    const joinedAt = user.state.joinedAt ?? this.joins.get(joinKey)?.last;
    const recentJoin = joinedAt !== undefined && joinedAt !== null && now - joinedAt <= 30000;
    // P is a weak signal. Unknown username (e.g., raw MTProto peer) contributes zero.
    const profile = username === '' ? 1 : 0;
    const sustained = Math.min(1, user.strikes / 3);
    const score = Math.min(100, Math.round(35 * user.depletion + 35 * sustained +
      20 * (chat.exceeded ? 1 : 0) + 5 * (recentJoin ? 1 : 0) + 5 * profile));
    const attack = score >= this.config.threshold && user.strikes >= 2;
    return { score, attack, userExceeded: user.exceeded, chatExceeded: chat.exceeded,
      strikes: user.strikes, recentJoin, kind, at: now };
  }

  sweep() {
    const now = this.clock();
    this.prune(this.users, this.config.maxUsers + 1, now);
    this.prune(this.chats, this.config.maxGroups + 1, now);
    this.prune(this.joins, this.config.maxUsers + 1, now);
  }
}
