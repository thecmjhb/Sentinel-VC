import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { SessionVault, VoiceAccounts } from '../voiceAccounts.js';
import { loadConfig } from '../config.js';
import { Store } from '../store.js';
import { SerialQueue } from '../runtime.js';
import { setTimeout as delay } from 'node:timers/promises';
import { waitFor } from '../test-support/waitFor.js';

test('vault encrypts sessions and authenticates owner, ciphertext and key; deletion is durable',async t=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'sentinel-voice-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  const vault=new SessionVault(directory,'a'.repeat(64));
  await vault.save(1,'SENSITIVE_TEST_SESSION',new Set(['-1001']));
  const bytes=await readFile(vault.file(1),'utf8');assert.doesNotMatch(bytes,/SENSITIVE_TEST_SESSION|-1001/);
  assert.equal((await vault.read(1)).session,'SENSITIVE_TEST_SESSION');
  await copyFile(vault.file(1),vault.file(2));await assert.rejects(vault.read(2));
  const bad=new SessionVault(directory,'b'.repeat(64));await assert.rejects(bad.read(1));
  const tampered=JSON.parse(bytes);tampered.tag='00'.repeat(16);await writeFile(vault.file(1),JSON.stringify(tampered));await assert.rejects(vault.read(1));
  await assert.rejects(vault.owners(1),/capacity/);await vault.remove(1);await vault.remove(2);assert.deepEqual(await vault.owners(2),[]);
});

function fixture(t) {
  const store=new Store(':memory:');t.after(()=>store.close());
  const config={...loadConfig({}, {requireToken:false}),mtQrEnabled:true,mtSessionKey:'a'.repeat(64),mtMaxAccounts:2};
  const state={owner:'1',admin:true,rights:true,password:false,qr:0,deleted:[],revoked:0,records:new Map(),ended:[],msgs:[],cancelWait:false,
    nextMessage:100,promptOptions:[],received:[],expected:'  PRIVATE_TEST_PASSWORD/  ',qrDelay:0};
  const clients=[];
  const clientFactory=session=> {
    const client={connected:true,session:{save:()=>session || 'SECRET_SESSION'},getMe:async()=>({id:state.owner,bot:false}),
      connect:async()=>{},disconnect:async()=>{client.connected=false;},checkAuthorization:async()=>true,getDialogs:async()=>{},
      invoke:async()=>{state.revoked++;},signInUserWithQrCode:async(_credentials,params)=>{
        await params.qrCode({token:Buffer.from('opaque_login_token'),expires:Math.floor(Date.now()/1000)+30});
        if(state.password) {
          for (;;) {
            try {
              const password=await params.password();state.received.push(password);
              if(password!==state.expected) {const error=new Error('invalid');error.errorMessage='PASSWORD_HASH_INVALID';throw error;}
              break;
            } catch(error) {if(await params.onError(error))throw new Error('AUTH_USER_CANCEL');}
          }
        }
        if(state.cancelWait) await new Promise((resolve,reject)=>params.abortSignal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
      }};clients.push(client);return client;
  };
  const api={sendPhoto:async(id,file,options)=>{assert.ok(id>0);assert.equal(options.protect_content,true);assert.ok(file);if(state.qrDelay)await delay(state.qrDelay);state.qr++;return{message_id:state.qr};},deleteMessage:async(id,m)=>state.deleted.push([id,m])};
  const engine={administrator:async()=>state.admin,reply:async(id,msg,options)=>{
    state.msgs.push({id,msg});state.promptOptions.push(options);return {message_id:state.nextMessage++};
  },process:async()=>{}};
  const adapterFactory=options=>({ ...options, start:async()=>{},stop:async()=>options.client.disconnect(),
    rights:async()=>state.rights,requestRefresh(){},dropChat(){},capability:()=> 'monitoring',entry:()=>({}),
    setAdmission:async()=>true,endCall:async(...args)=>{state.ended.push(args);return true;},mitigate:async()=>true });
  const vault={owners:async(limit)=>{if(state.records.size>limit)throw new Error('capacity');return [...state.records.keys()];},
    read:async id=>state.records.get(id),save:async(id,session,chats)=>state.records.set(id,{owner:id,session,chats:[...chats]}),remove:async id=>state.records.delete(id)};
  const queue=new SerialQueue();const manager=new VoiceAccounts({config,store,engine,queue,api,selfId:9,vault,clientFactory,adapterFactory});
  const finish=async()=>{await Promise.allSettled([...manager.jobs]);await queue.drain();};
  t.after(()=>manager.stop());return {manager,state,store,clients,finish};
}
test('private QR auto-verifies the actor account and rights, scopes routing, saves encrypted-store records and revokes on disconnect',async t=>{
  const f=fixture(t);await f.manager.connect(1,-1001);await f.finish();
  assert.equal(f.manager.allows(-1001),true);assert.equal(f.manager.allows(-1002),false);
  assert.equal(f.state.records.get('1').owner,'1');assert.equal(f.state.deleted.length,1);
  await f.manager.connect(1,-1002);assert.equal(f.manager.allows(-1002),true);assert.equal(f.state.qr,1,'already verified account reused');
  f.state.admin=false;await assert.rejects(f.manager.endCall(-1001,{vc:true},'77'),/current community/);
  assert.equal(f.state.ended.length,0);f.state.admin=true;
  await f.manager.disconnect(1);assert.equal(f.manager.allows(-1001),false);assert.equal(f.state.records.size,0);assert.equal(f.state.revoked,1);
});
test('mismatched account, revoked admin and insufficient call rights never attach a session',async t=>{
  for(const kind of ['mismatch','rights']) {
    const f=fixture(t);if(kind==='mismatch')f.state.owner='2';if(kind==='rights')f.state.rights=false;
    await f.manager.connect(1,-1001);await f.finish();assert.equal(f.manager.allows(-1001),false);assert.equal(f.state.records.size,0);
    assert.ok(f.clients.every(c=>!c.connected));assert.equal(f.state.deleted.length,1);
  }
  const f=fixture(t);f.state.admin=false;await assert.rejects(f.manager.connect(1,-1001),/current community/);assert.equal(f.clients.length,0);
});

async function prompt(f,owner=1,previous=null) {
  return waitFor(()=>{
    const request=f.manager.pending.get(String(owner))?.passwordRequest;
    return request?.message && request.message!==previous ? request.message : false;
  },'a fresh private password question');
}
function passwordMessage(message,text,owner=1) {
  return {from:{id:owner},chat:{id:owner,type:'private'},message:{message_id:1000+message,text,
    reply_to_message:{message_id:message,from:{id:9}}}};
}
test('hosted user completes 2FA in a bound private reply; whitespace is preserved, deletion attempted and no password persisted',async t=>{
  const f=fixture(t);f.state.password=true;await f.manager.connect(1,-1001);
  const question=await prompt(f);const ctx=passwordMessage(question,f.state.expected);
  const oversized=passwordMessage(question,'x'.repeat(513));assert.equal(await f.manager.acceptPassword(oversized),true);
  assert.equal(f.state.received.length,0,'invalid size never enters SDK verification');
  assert.equal(await f.manager.acceptPassword(passwordMessage(question,'foreign',2)),false);
  const group=passwordMessage(question,'group');group.chat={id:-1001,type:'supergroup'};
  assert.equal(await f.manager.acceptPassword(group),false);
  assert.equal(await f.manager.acceptPassword(ctx),true);assert.equal(ctx.message.text,'');await f.finish();
  assert.equal(f.manager.allows(-1001),true);assert.deepEqual(f.state.received,[f.state.expected]);
  assert.ok(f.state.deleted.some(([id,msg])=>id===1&&msg===ctx.message.message_id));
  assert.ok(f.state.deleted.some(([,msg])=>msg===question));
  assert.ok(f.state.promptOptions.some(x=>x?.reply_markup?.force_reply===true&&x?.protect_content===true));
  assert.doesNotMatch(JSON.stringify([...f.state.records.values()]),/PRIVATE_TEST_PASSWORD/);
  assert.doesNotMatch(JSON.stringify(f.state.msgs),/PRIVATE_TEST_PASSWORD/);
  assert.doesNotMatch(JSON.stringify(f.store.db.prepare('SELECT * FROM audit').all()),/PRIVATE_TEST_PASSWORD/);
  const duplicate=passwordMessage(question,'duplicate');assert.equal(await f.manager.acceptPassword(duplicate),true);assert.equal(f.state.received.length,1);
});
test('incorrect private passwords get fresh questions and are capped at three attempts',async t=>{
  const f=fixture(t);f.state.password=true;await f.manager.connect(1,-1001);let previous=null;
  for(let i=0;i<3;i++) {
    const question=await prompt(f,1,previous);assert.notEqual(question,previous);
    if(previous)assert.equal(await f.manager.acceptPassword(passwordMessage(previous,'stale')),true);
    await f.manager.acceptPassword(passwordMessage(question,'wrong'));previous=question;
  }
  await f.finish();assert.equal(f.manager.allows(-1001),false);assert.equal(f.state.received.length,3);assert.equal(f.state.records.size,0);
  assert.equal(f.manager.pending.size,0);assert.ok(f.clients.every(c=>!c.connected));
});

test('2FA account connection tolerates delayed QR delivery before requesting the password', {timeout:5000},async t=>{
  const f=fixture(t);f.state.password=true;f.state.qrDelay=50;
  await f.manager.connect(1,-1001);const question=await prompt(f);
  assert.equal(f.state.qr,1);await f.manager.acceptPassword(passwordMessage(question,f.state.expected));
  await f.finish();assert.equal(f.manager.allows(-1001),true);assert.equal(f.state.records.size,1);
});
test('2FA cancellation rejects its pending question and never accepts a late password',async t=>{
  const f=fixture(t);f.state.password=true;await f.manager.connect(1,-1001);const question=await prompt(f);
  const command=passwordMessage(question,'/cancelvoice');command.message.entities=[{type:'bot_command',offset:0,length:12}];
  assert.equal(await f.manager.acceptPassword(command),false,'explicit cancellation reaches command handler');
  f.manager.cancel(1);await f.finish();assert.equal(f.manager.allows(-1001),false);
  assert.equal(await f.manager.acceptPassword(passwordMessage(question,f.state.expected)),true);assert.equal(f.state.received.length,0);
});

test('an expired 2FA deadline rejects a reply even if the timer callback has not run',async t=>{
  const f=fixture(t);f.state.password=true;await f.manager.connect(1,-1001);const question=await prompt(f);
  f.manager.pending.get('1').expiresAt=Date.now()-1;
  assert.equal(await f.manager.acceptPassword(passwordMessage(question,f.state.expected)),true);
  await f.finish();assert.equal(f.manager.allows(-1001),false);assert.equal(f.state.received.length,0);
});
test('password deletion failure is contained and redacted, without blocking an otherwise valid login',async t=>{
  const f=fixture(t);f.state.password=true;f.manager.api.deleteMessage=async()=>{const error=new Error('transport body');error.name='GrammyError';throw error;};
  await f.manager.connect(1,-1001);const question=await prompt(f);await f.manager.acceptPassword(passwordMessage(question,f.state.expected));await f.finish();
  assert.equal(f.manager.allows(-1001),true);assert.doesNotMatch(JSON.stringify(f.state.msgs),/PRIVATE_TEST_PASSWORD/);
});
test('cancellation and restored sessions preserve account isolation and reject changed identities',async t=>{
  const f=fixture(t);f.state.cancelWait=true;await f.manager.connect(1,-1001);
  await waitFor(()=>f.state.qr,'QR delivery before cancellation');
  f.manager.cancel(1);await f.finish();assert.equal(f.manager.allows(-1001),false);assert.equal(f.state.records.size,0);
  const r=fixture(t);r.state.records.set('1',{owner:'1',session:'RESTORED',chats:['-1001']});await r.manager.start();assert.equal(r.manager.allows(-1001),true);
  const wrong=fixture(t);wrong.state.owner='2';wrong.state.records.set('1',{owner:'1',session:'RESTORED',chats:['-1001']});await wrong.manager.start();assert.equal(wrong.manager.allows(-1001),false);
});
test('configuration refuses a QR deployment without valid credentials and encryption key',()=>{
  assert.throws(()=>loadConfig({MT_QR_ENABLED:'true'},{requireToken:false}),/requires/);
  const config=loadConfig({MT_QR_ENABLED:'true',MT_API_ID:'123',MT_API_HASH:'a'.repeat(32),MT_SESSION_KEY:'b'.repeat(64)},{requireToken:false});
  assert.equal(config.mtEnabled,false);assert.equal(config.mtQrEnabled,true);assert.equal(config.mtAllowedChats.size,0);
});

test('separate account clients cannot take over a bound community and disconnect only removes the actor account',async t=>{
  const f=fixture(t);await f.manager.connect(1,-1001);await f.finish();
  f.state.owner='2';await f.manager.connect(2,-1002);await f.finish();
  assert.equal(f.manager.bindings.get('-1001'),'1');assert.equal(f.manager.bindings.get('-1002'),'2');
  assert.notEqual(f.manager.adapter(-1001).client,f.manager.adapter(-1002).client);
  await assert.rejects(f.manager.connect(2,-1001),/existing account binding/);
  await f.manager.disconnect(1);assert.equal(f.manager.allows(-1001),false);assert.equal(f.manager.allows(-1002),true);
  assert.deepEqual([...f.state.records.keys()],['2']);
});
