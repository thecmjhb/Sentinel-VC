import test from 'node:test';
import assert from 'node:assert/strict';
import { uiFixture } from '../test-support/uiFixture.js';
import { VoiceAccounts } from '../voiceAccounts.js';
import { waitFor } from '../test-support/waitFor.js';

test('bound private password reply is consumed before commands or hosted access policies and public text is not consumed',async t=>{
  let access=0,consumed=0;
  const f=uiFixture(t,{installAccess:({bot})=>bot.use((_ctx,next)=>{access++;return next();})});
  f.engine.vc={acceptPassword:async ctx=>{
    if(ctx.chat?.type==='private'&&ctx.message?.reply_to_message?.message_id===77) {
      consumed++;ctx.message.text='';return true;
    }
    return false;
  }};
  await f.bot.handleUpdate({update_id:1,message:{message_id:1,date:Math.floor(Date.now()/1000),from:{id:1,is_bot:false,first_name:'User'},chat:{id:1,type:'private'},
    text:'/verify',entities:[{type:'bot_command',offset:0,length:7}],reply_to_message:{message_id:77,from:{id:9,is_bot:true,first_name:'Bot'}}}});
  assert.equal(consumed,1);assert.equal(access,0);assert.equal(f.calls.filter(x=>x.method==='sendMessage').length,0);
  await f.bot.handleUpdate({update_id:2,message:{message_id:2,date:Math.floor(Date.now()/1000),from:{id:1,is_bot:false,first_name:'User'},chat:{id:-100111,type:'supergroup'},
    text:'/help',entities:[{type:'bot_command',offset:0,length:5}],reply_to_message:{message_id:77,from:{id:9,is_bot:true,first_name:'Bot'}}}});
  assert.equal(consumed,1);assert.equal(access,0);
});

test('2FA reply and verified attachment share the real application queue without deadlock', {timeout:5000},async t=>{
  const f=uiFixture(t);const records=new Map();
  const client={connected:true,session:{save:()=> 'OFFLINE_AUTH_SESSION'},connect:async()=>{},disconnect:async()=>{},checkAuthorization:async()=>true,
    getMe:async()=>({id:1,bot:false}),getDialogs:async()=>{},invoke:async()=>{},signInUserWithQrCode:async(_credentials,params)=>{
      const password=await params.password();assert.equal(password,'OFFLINE_2FA_PASSWORD');
    }};
  const adapterFactory=options=>({...options,start:async()=>{},stop:async()=>{},rights:async()=>true,requestRefresh(){},dropChat(){}});
  const manager=new VoiceAccounts({config:{...f.config,mtQrEnabled:true,mtMaxAccounts:2},store:f.store,engine:f.engine,queue:f.queue,selfId:9,
    api:{deleteMessage:async()=>{},sendPhoto:async()=>({message_id:99})},clientFactory:()=>client,adapterFactory,
    vault:{owners:async()=>[],save:async(id,session,chats)=>records.set(id,{session,chats:[...chats]}),remove:async id=>records.delete(id)}});
  f.engine.vc=manager;t.after(()=>manager.stop());
  await f.queue.run(()=>manager.connect(1,-100111));
  const question=await waitFor(()=>manager.pending.get('1')?.passwordRequest?.message,'private 2FA prompt');
  assert.ok(question);
  await f.bot.handleUpdate({update_id:1,message:{message_id:50,date:Math.floor(Date.now()/1000),from:{id:1,is_bot:false,first_name:'User'},chat:{id:1,type:'private'},
    text:'OFFLINE_2FA_PASSWORD',reply_to_message:{message_id:question,from:{id:9,is_bot:true,first_name:'Bot'}}}});
  await Promise.allSettled([...manager.jobs]);assert.equal(manager.allows(-100111),true);
  assert.equal(records.size,1);assert.doesNotMatch(JSON.stringify(f.calls),/OFFLINE_2FA_PASSWORD/);
});
