import 'dotenv/config';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logError } from '../runtime.js';

async function login() {
  const apiId = Number(process.env.MT_API_ID), apiHash = process.env.MT_API_HASH || '';
  if (!Number.isInteger(apiId) || apiId <= 0 || !/^[a-f0-9]{32}$/i.test(apiHash)) {
    console.error('Set MT_API_ID and MT_API_HASH from https://my.telegram.org/apps in .env'); process.exitCode = 1; return;
  }
  if (!process.stdin.isTTY) { console.error('Run this login command in an interactive terminal.'); process.exitCode = 1; return; }
  let muted = false;
  const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk, encoding); callback(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const ask = async (prompt, secret = false) => {
    process.stdout.write(prompt); muted = secret;
    try { return await rl.question(''); } finally { muted = false; if (secret) process.stdout.write('\n'); }
  };
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 3 });
  client.setLogLevel('none');
  try {
    await client.start({
      phoneNumber: () => ask('Your consenting admin account phone (+country code): '),
      phoneCode: () => ask('Telegram login code (hidden): ', true),
      password: () => ask('2FA password (hidden): ', true),
      emailAddress: () => ask('Email (if Telegram requires it): '),
      emailVerification: async () => ({ code: await ask('Email verification code (hidden): ', true) }),
      onError: error => { logError('login_failed', error); return true; }
    });
    const me = await client.getMe();
    if (me.bot) throw new Error('A user admin account is required');
    const target = path.resolve(process.env.MT_SESSION_FILE || './.secrets/mtproto.session');
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, client.session.save(), { mode: 0o600, flag: 'wx' });
    console.log(`Session saved to ${target}. Keep this file private. It was not printed to the terminal.`);
  } finally { rl.close(); await client.disconnect(); }
}
login().catch(error => { logError('login_failed', error); process.exitCode = 1; });
