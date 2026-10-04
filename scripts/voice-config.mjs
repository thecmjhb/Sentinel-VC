import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { parse } from 'dotenv';
import { loadConfig } from '../config.js';

export function voiceEnvironment(existing, { apiId, apiHash, chats, sessionFile }) {
  const ids = [...new Set(String(chats).split(',').map(x => x.trim()).filter(Boolean))];
  if (!ids.length || ids.length > 10000) throw new Error('Provide at least one numeric community ID');
  const values = { MT_API_ID: String(apiId).trim(), MT_API_HASH: String(apiHash).trim(),
    MT_ALLOWED_CHATS: ids.join(','), MT_SESSION_FILE: sessionFile || './.secrets/mtproto.session' };
  if (/[\r\n"'`$]/.test(values.MT_SESSION_FILE)) throw new Error('Invalid session-file path');
  loadConfig({ ...existing, ...values, MT_ENABLED: 'true' }, { requireToken: false });
  return values;
}
export async function saveVoiceEnvironment(filename, values, enabled = false) {
  const original = await readFile(filename, 'utf8');
  const updates = { ...values, MT_ENABLED: String(enabled) }, written = new Set();
  const lines = original.split(/\r?\n/).filter(line => {
    const key = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/.exec(line)?.[1];
    if (!Object.hasOwn(updates, key)) return true;
    if (written.has(key)) return false; written.add(key); return true;
  }).map(line => {
    const key = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/.exec(line)?.[1];
    return Object.hasOwn(updates, key) ? `${key}=${JSON.stringify(updates[key])}` : line;
  });
  for (const [key, value] of Object.entries(updates)) if (!written.has(key)) lines.push(`${key}=${JSON.stringify(value)}`);
  const contents = lines.join('\n').trimEnd() + '\n';
  loadConfig(parse(contents), { requireToken: false });
  const temporary = path.join(path.dirname(filename), `.voice-${randomBytes(8).toString('hex')}.tmp`);
  try { await writeFile(temporary, contents, {mode:0o600,flag:'wx'}); await rename(temporary, filename); }
  finally { await unlink(temporary).catch(()=>{}); }
}
