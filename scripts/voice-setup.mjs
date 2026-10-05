import { readFile, access } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { parse } from 'dotenv';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { voiceEnvironment, saveVoiceEnvironment } from './voice-config.mjs';
import { logError } from '../runtime.js';
import { randomBytes } from 'node:crypto';
import { loadConfig } from '../config.js';

async function main() {
  if (!process.stdin.isTTY) throw new Error('Run voice setup in an interactive VPS terminal');
  const filename = path.resolve('.env'), existing = parse(await readFile(filename,'utf8'));
  console.log('Sentinel-VC voice setup / Voice account setup\nUse your own consenting user-admin account. No login code or session is sent through the bot.\nCreate your Telegram API application at https://my.telegram.org/apps first.');
  let hidden = false;
  const output = new Writable({write(chunk,encoding,done){ if (!hidden) process.stdout.write(chunk,encoding); done(); }});
  const rl = createInterface({input:process.stdin,output,terminal:true});
  const ask = async (label, fallback='', secret=false) => {
    process.stdout.write(label + (fallback ? ' [Enter to keep existing]' : '') + ': '); hidden=secret;
    try { return (await rl.question('')).trim() || fallback; }
    finally { hidden=false; if (secret) process.stdout.write('\n'); }
  };
  let values;
  try {
    const apiId = await ask('API ID',existing.MT_API_ID);
    const apiHash = await ask('API hash (hidden)',existing.MT_API_HASH,true);
    if (process.argv.includes('--qr')) {
      values={MT_API_ID:apiId,MT_API_HASH:apiHash,MT_QR_ENABLED:'true',MT_SESSION_KEY:existing.MT_SESSION_KEY || randomBytes(32).toString('hex')};
      loadConfig({...existing,...values},{requireToken:false});
      await saveVoiceEnvironment(filename,values,existing.MT_ENABLED === 'true');
      console.log('QR connection enabled. Restart the bot, then /communities -> select -> Connect voice account -> Scan login QR. Each user connects their own account; 2FA is handled by replying to the active private bot question. Password-message deletion is attempted; password text is not persisted in database/logs. Telegram copies may remain. No website or per-user VPS access is needed. Keep MT_SESSION_KEY private and back it up with encrypted sessions.');
      return;
    }
    const chats = await ask('Allowed numeric group/channel IDs, comma-separated',existing.MT_ALLOWED_CHATS);
    values = voiceEnvironment(existing,{apiId,apiHash,chats,sessionFile:existing.MT_SESSION_FILE});
    await saveVoiceEnvironment(filename,values,false);
  } finally { rl.close(); }
  const sessionPath = path.resolve(values.MT_SESSION_FILE);
  let found = true; try { await access(sessionPath); } catch { found=false; }
  if (!found) {
    const exit = await new Promise((resolve,reject)=> {
      const child = spawn(process.execPath,['scripts/mtproto-login.js'], {stdio:'inherit',env:{...process.env,...values}});
      child.once('error',reject); child.once('exit',resolve);
    });
    if (exit !== 0) throw new Error('Login did not finish; MT_ENABLED remains false');
  }
  const client = new TelegramClient(new StringSession((await readFile(sessionPath,'utf8')).trim()),
    Number(values.MT_API_ID),values.MT_API_HASH,{connectionRetries:2,requestRetries:1,floodSleepThreshold:0});
  client.setLogLevel('none');
  try {
    await client.connect();
    if (!await client.checkAuthorization()) throw new Error('Session is not authorized');
    const me = await client.getMe(); if (me.bot) throw new Error('Use a USER account, not another bot');
    console.log(`Authorized user account ID: ${me.id}. Confirm this is your intended administrator account.`);
    await saveVoiceEnvironment(filename,values,true);
  } finally { await client.disconnect(); }
  console.log('Voice account enabled in .env. Restart your bot service.\nIn Telegram grant this USER account Manage Video Chats/Live Streams in each allowed community.\nPrivately: /communities -> select -> Voice controls ON -> Raid shield ON. Start with Observe.\nFor PM2 owner package: bash svc restart sentinelvc-master --update-env\nFor Docker: docker compose up -d --force-recreate\nLogin/session files remain on this machine; protect them and revoke this session in Telegram to disconnect it.');
}
main().catch(error=>{ logError('voice_setup_failed',error); console.error('Voice setup did not complete. Check API credentials, numeric IDs and your local session. MT_ENABLED remains false if authorization failed.'); process.exitCode=1; });
