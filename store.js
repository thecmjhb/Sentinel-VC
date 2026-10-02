import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(dataDir) {
    if (dataDir !== ':memory:') mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(dataDir === ':memory:' ? dataDir : path.join(dataDir, 'sentinel.db'));
    const version = this.db.prepare('PRAGMA user_version').get().user_version;
    if (![0, 1].includes(version)) {
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
      PRAGMA user_version=1;`);
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
       'vc-join-muted-intent','vc-join-muted-acknowledged') ORDER BY at DESC,id DESC LIMIT ?`)
      .all(String(chatId), limit);
  }
  prune(retentionDays) {
    const now = Date.now();
    this.db.prepare('DELETE FROM gates WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM cooldowns WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM updates WHERE expires<=?').run(now);
    this.db.prepare('DELETE FROM audit WHERE at<?').run(now - retentionDays * 86400000);
    this.db.prepare('DELETE FROM preferences WHERE updated<?').run(now - 365 * 86400000);
  }
  close() { this.db.close(); }
}
