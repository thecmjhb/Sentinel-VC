import 'dotenv/config';
import path from 'node:path';

export function loadConfig(env = process.env, { requireToken = true } = {}) {
  const integer = (name, fallback, min, max) => {
    const raw = env[name] === undefined || env[name] === '' ? fallback : Number(env[name]);
    if (!Number.isInteger(raw) || raw < min || raw > max) throw new Error(`Invalid ${name}`);
    return raw;
  };
  const boolean = (name, fallback = false) => {
    const raw = env[name] ?? String(fallback);
    if (!['true', 'false'].includes(raw)) throw new Error(`${name} must be true or false`);
    return raw === 'true';
  };
  const token = env.BOT_TOKEN || '';
  if (requireToken && !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) throw new Error('Set a valid BOT_TOKEN in .env');
  const mode = env.DEFAULT_MODE || 'observe';
  if (!['observe', 'enforce'].includes(mode)) throw new Error('Invalid DEFAULT_MODE');
  const metricsToken = env.METRICS_TOKEN || '';
  if (metricsToken && metricsToken.length < 32) throw new Error('METRICS_TOKEN must have at least 32 characters');
  const mtEnabled = boolean('MT_ENABLED');
  const mtQrEnabled = boolean('MT_QR_ENABLED');
  const mtSessionKey = env.MT_SESSION_KEY || '';
  const mtAllowedChats = (env.MT_ALLOWED_CHATS || '').split(',').filter(Boolean).map(x => x.trim());
  if (mtAllowedChats.some(x => !/^-100\d+$/.test(x))) throw new Error('Invalid MT_ALLOWED_CHATS');
  if (mtEnabled && (!env.MT_API_ID || !/^[a-f0-9]{32}$/i.test(env.MT_API_HASH || '') || !mtAllowedChats.length)) {
    throw new Error('MT_ENABLED requires MT_API_ID, MT_API_HASH, and MT_ALLOWED_CHATS');
  }
  if (mtQrEnabled && (!Number(env.MT_API_ID) || !/^[a-f0-9]{32}$/i.test(env.MT_API_HASH || '') || !/^[a-f0-9]{64}$/i.test(mtSessionKey)))
    throw new Error('MT_QR_ENABLED requires MT_API_ID, MT_API_HASH and a 32-byte hex MT_SESSION_KEY');
  return Object.freeze({
    token, mode, dataDir: path.resolve(env.DATA_DIR || './data'),
    maxGroups: integer('MAX_GROUPS', 1000, 1, 10000),
    maxUsers: integer('MAX_TRACKED_USERS', 50000, 100, 1000000),
    ttlMs: integer('STATE_TTL_SECONDS', 900, 60, 86400) * 1000,
    userCapacity: integer('USER_CAPACITY', 20, 2, 1000),
    userRefill: integer('USER_REFILL_PER_SECOND', 1, 1, 1000),
    vcCapacity: integer('VC_CAPACITY', 24, 4, 1000),
    vcRefill: integer('VC_REFILL_PER_SECOND', 4, 1, 1000),
    vcRaidWindowSeconds: integer('VC_RAID_WINDOW_SECONDS', 10, 2, 60),
    vcRaidUniqueJoins: integer('VC_RAID_UNIQUE_JOINS', 12, 3, 1000),
    vcRaidBaselineMultiplier: integer('VC_RAID_BASELINE_MULTIPLIER', 3, 2, 10),
    chatCapacity: integer('CHAT_CAPACITY', 80, 10, 10000),
    chatRefill: integer('CHAT_REFILL_PER_SECOND', 10, 1, 10000),
    threshold: integer('THREAT_THRESHOLD', 65, 50, 100),
    restrictionSeconds: integer('RESTRICTION_SECONDS', 180, 60, 86400),
    captchaSeconds: integer('CAPTCHA_SECONDS', 180, 60, 3600),
    retentionDays: integer('RETENTION_DAYS', 7, 1, 90),
    httpHost: env.HTTP_HOST || '127.0.0.1',
    httpPort: integer('HTTP_PORT', 18765, 1, 65535), metricsToken,
    mtEnabled, mtQrEnabled, mtSessionKey,
    mtMaxAccounts: integer('MT_MAX_ACCOUNTS', 20, 1, 100),
    mtApiId: integer('MT_API_ID', 0, mtEnabled || mtQrEnabled ? 1 : 0, 2147483647),
    mtApiHash: env.MT_API_HASH || '',
    mtSessionFile: path.resolve(env.MT_SESSION_FILE || './.secrets/mtproto.session'),
    mtAllowedChats: new Set(mtAllowedChats)
  });
}
