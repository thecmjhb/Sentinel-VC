import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'dotenv';
import { voiceEnvironment,saveVoiceEnvironment } from '../scripts/voice-config.mjs';

test('voice wizard validates account credentials and private numeric allowlist without exposing or replacing the bot token',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'sentinel-voice-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));const file=path.join(dir,'.env');
  const original='# Keep operator config\nBOT_TOKEN=9:offline_fixture_never_sent\nHTTP_PORT=19234\nCUSTOM_SETTING=kept\nMT_ENABLED=false\n';await writeFile(file,original);
  const values=voiceEnvironment(parse(original),{apiId:1,apiHash:'a'.repeat(32),chats:' -1001, -1002, -1001'});
  assert.equal(values.MT_ALLOWED_CHATS,'-1001,-1002');
  await saveVoiceEnvironment(file,values,false);let env=parse(await readFile(file,'utf8'));
  assert.equal(env.BOT_TOKEN,'9:offline_fixture_never_sent');assert.equal(env.HTTP_PORT,'19234');assert.equal(env.CUSTOM_SETTING,'kept');assert.equal(env.MT_ENABLED,'false');
  await saveVoiceEnvironment(file,values,true);env=parse(await readFile(file,'utf8'));assert.equal(env.MT_ENABLED,'true');
  assert.throws(()=>voiceEnvironment(env,{apiId:1,apiHash:'bad',chats:'-1001'}));
  assert.throws(()=>voiceEnvironment(env,{apiId:1,apiHash:'a'.repeat(32),chats:'https://t.me/private'}));
});
