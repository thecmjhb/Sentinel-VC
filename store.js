import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(dataDir) {
    if (dataDir !== ':memory:') mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(dataDir === ':memory:' ? dataDir : path.join(dataDir, 'sentinel.db'));
    const version = this.db.prepare('PRAGMA user_version').get().user_version;
    if (![0, 1, 2].includes(version)) {
      this.db.close();
      throw new Error(`Unsupported database schema version ${version}; use a compatible release`);
    }
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, settings TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS gates (chat_id TEXT, user_id TEXT, data TEXT NOT NULL, expires INTEGER NOT NULL,
        PRIMARY KEY(chat_id,user_id));
      CREATE TABLE IF NOT EXISTS cooldowns (key TEXT PRIMARY KEY, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, at INTEGER NOT NULL, chat_id TEXT, user_id TEXT,
        action TEXT NOT NULL, detail TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS audit_at ON audit(at);
      CREATE INDEX IF NOT EXISTS audit_chat_at ON audit(chat_id,at);
      CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS preferences (user_id TEXT PRIMARY KEY, language TEXT NOT NULL, updated INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS communities (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, updated INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS community_admins (chat_id TEXT, user_id TEXT, updated INTEGER NOT NULL, PRIMARY KEY(chat_id,user_id));
      CREATE INDEX IF NOT EXISTS admin_lookup ON community_admins(user_id,updated);
      CREATE INDEX IF NOT EXISTS gates_user ON gates(user_id,expires);
      CREATE TABLE IF NOT EXISTS selectors (user_id TEXT PRIMARY KEY, group_request INTEGER, channel_request INTEGER, expires INTEGER);
      PRAGMA user_version=2;`);
  }
  group(id) {
    const row = this.db.prepare('SELECT settings FROM groups WHERE id=?').get(String(id));
    return row ? JSON.parse(row.settings) : null;
  }
  language(userId) {
    return this.db.prepare('SELECT language FROM preferences WHERE user_id=?').get(String(userId))?.language || null;
  }
  setLanguage(userId, language) {
    if (!Number.isSafeInteger(userId) || userId <= 0 || !/^[a-z]{2}$/.test(language)) throw new Error('Invalid language preference');
    this.db.prepare('INSERT INTO preferences VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET language=excluded.language, updated=excluded.updated')
      .run(String(userId), language, Date.now());
  }
  setGroup(id, settings) {
    this.db.prepare('INSERT INTO groups VALUES(?,?) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings')
      .run(String(id), JSON.stringify(settings));
  }
  groups() { return this.db.prepare('SELECT id, settings FROM groups').all().map(x => ({ id: x.id, ...JSON.parse(x.settings) })); }
  rememberCommunity(chat, userId, limit = 1000) {
    if (!Number.isSafeInteger(chat.id) || chat.id >= 0 || !['supergroup', 'channel'].includes(chat.type) ||
        !Number.isSafeInteger(userId) || userId <= 0) throw new Error('Invalid community');
    if (!this.db.prepare('SELECT id FROM communities WHERE id=?').get(String(chat.id)) &&
        this.db.prepare('SELECT COUNT(*) AS n FROM communities').get().n >= limit) throw new Error('Community capacity exceeded');
    const count = this.db.prepare('SELECT COUNT(*) AS n FROM community_admins WHERE chat_id=?').get(String(chat.id)).n;
    if (count >= 100 && !this.db.prepare('SELECT user_id FROM community_admins WHERE chat_id=? AND user_id=?').get(String(chat.id), String(userId)))
      throw new Error('Administrator list capacity exceeded');
    this.db.prepare('INSERT INTO communities VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET type=excluded.type,title=excluded.title,updated=excluded.updated')
      .run(String(chat.id), chat.type, String(chat.title || chat.id).slice(0, 128), Date.now());
    this.db.prepare('INSERT INTO community_admins VALUES(?,?,?) ON CONFLICT(chat_id,user_id) DO UPDATE SET updated=excluded.updated')
      .run(String(chat.id), String(userId), Date.now());
  }
  communitiesFor(userId, page = 0) {
    if (!Number.isSafeInteger(page) || page < 0 || page > 100000) throw new RangeError('Invalid page');
    return this.db.prepare('SELECT c.* FROM communities c JOIN community_admins a ON a.chat_id=c.id WHERE a.user_id=? ORDER BY c.id LIMIT 5 OFFSET ?')
      .all(String(userId), page * 5);
  }
  unlinkCommunity(chatId, userId) { this.db.prepare('DELETE FROM community_admins WHERE chat_id=? AND user_id=?').run(String(chatId), String(userId)); }
  communityAdministrators(chatId, limit = 3) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new RangeError('Invalid administrator notification limit');
    return this.db.prepare('SELECT user_id FROM community_admins WHERE chat_id=? AND updated>? ORDER BY updated DESC LIMIT ?')
      .all(String(chatId), Date.now() - 365 * 86400000, limit).map(r => r.user_id);
  }
  forgetCommunity(chatId) {
    this.db.prepare('DELETE FROM communities WHERE id=?').run(String(chatId));
    this.db.prepare('DELETE FROM community_admins WHERE chat_id=?').run(String(chatId));
  }
  userGates(userId, page = 0) {
    if (!Number.isSafeInteger(page) || page < 0 || page > 100000) throw new RangeError('Invalid page');
    return this.db.prepare('SELECT chat_id FROM gates WHERE user_id=? AND expires>? ORDER BY chat_id LIMIT 5 OFFSET ?')
      .all(String(userId), Date.now(), page * 5);
  }
  setSelector(userId, groupRequest, channelRequest) {
    this.db.prepare('INSERT INTO selectors VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET group_request=excluded.group_request,channel_request=excluded.channel_request,expires=excluded.expires')
      .run(String(userId), groupRequest, channelRequest, Date.now() + 300000);
  }
  consumeSelector(userId, requestId) {
    const row = this.db.prepare('SELECT * FROM selectors WHERE user_id=? AND expires>?').get(String(userId), Date.now());
    const type = row?.group_request === requestId ? 'supergroup' : row?.channel_request === requestId ? 'channel' : null;
    if (type) this.db.prepare('DELETE FROM selectors WHERE user_id=?').run(String(userId));
    return type;
  }
  deleteGroup(id) {
    this.db.prepare('DELETE FROM groups WHERE id=?').run(String(id));
    this.db.prepare('DELETE FROM gates WHERE chat_id=?').run(String(id));
  }
  gate(chatId, userId) {
    const row = this.db.prepare('SELECT data FROM gates WHERE chat_id=? AND user_id=? AND expires>?')
      .get(String(chatId), String(userId), Date.now());
    return row ? JSON.parse(row.data) : null;
  }
  setGate(chatId, userId, gate) {
    this.db.prepare('INSERT INTO gates VALUES(?,?,?,?) ON CONFLICT(chat_id,user_id) DO UPDATE SET data=excluded.data, expires=excluded.expires')
      .run(String(chatId), String(userId), JSON.stringify(gate), gate.until * 1000);
  }
  deleteGate(chatId, userId) {
    this.db.prepare('DELETE FROM gates WHERE chat_id=? AND user_id=?').run(String(chatId), String(userId));
  }
  claim(key, durationMs, now = Date.now()) {
    const result = this.db.prepare(`INSERT INTO cooldowns VALUES(?,?) ON CONFLICT(key) DO UPDATE SET expires=excluded.expires
      WHERE cooldowns.expires<=?`).run(key, now + durationMs, now);
    return result.changes === 1;
  }
  seen(id) { return !!this.db.prepare('SELECT id FROM updates WHERE id=? AND expires>?').get(id, Date.now()); }
  mark(id) {
    this.db.prepare('INSERT INTO updates VALUES(?,?) ON CONFLICT(id) DO UPDATE SET expires=excluded.expires')
      .run(id, Date.now() + 86400000);
  }
  audit(chatId, userId, action, detail = {}) {
    this.db.prepare('INSERT INTO audit(at,chat_id,user_id,action,detail) VALUES(?,?,?,?,?)')
      .run(Date.now(), String(chatId), userId === null ? null : String(userId), action, JSON.stringify(detail));
  }
  incidents(chatId, limit = 10) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new RangeError('Invalid incident limit');
    return this.db.prepare(`SELECT at,user_id,action FROM audit WHERE chat_id=? AND action IN
      ('detect','restricted','verified','mitigation-failed','vc-mute-intent','vc-mute-acknowledged',
       'vc-join-muted-intent','vc-join-muted-acknowledged','vc-raid-observed','vc-shield-failed',
       'vc-admission-intent','vc-admission-acknowledged','vc-end-intent','vc-end-acknowledged') ORDER BY at DESC,id DESC LIMIT ?`)
      .all(String(chatId), limit);
  }
  prune(retentionDays) {
    const now = Date.now();
    this.db.prepare('DELETE FROM gates WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM cooldowns WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM updates WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM audit WHERE at<?').run(now - retentionDays * 86400000);
    this.db.prepare('DELETE FROM preferences WHERE updated<?').run(now - 365 * 86400000);
    this.db.prepare('DELETE FROM selectors WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM community_admins WHERE updated<?').run(now - 365 * 86400000);
    this.db.prepare('DELETE FROM communities WHERE id NOT IN (SELECT chat_id FROM community_admins) AND id NOT IN (SELECT id FROM groups)').run();
  }
  close() { this.db.close(); }
}
