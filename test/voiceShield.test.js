import test from 'node:test';
import assert from 'node:assert/strict';
import bigInt from 'big-integer';
import { Api } from 'teleproto';
import { loadConfig } from '../config.js';
import { VoiceBurstDetector } from '../voiceShield.js';
import { VoiceAdapter } from '../voiceAdapter.js';
import { Store } from '../store.js';
import { SerialQueue } from '../runtime.js';

test('distributed single-join burst is detected without requiring per-user churn; replay identities do not inflate unique count', () => {
  let now=0; const d=new VoiceBurstDetector(loadConfig({}, {requireToken:false}),()=>now);
  for (let i=0;i<11;i++) { now+=100; assert.equal(d.observe('call',{userId:i,kind:'vc_join'}).suspicious,false); }
  assert.equal(d.observe('call',{userId:10,kind:'vc_join'}).uniqueJoins,11);
  assert.equal(d.observe('call',{userId:11,kind:'vc_join'}).suspicious,true);
  assert.equal(d.observe('other',{userId:11,kind:'vc_join'}).suspicious,false);
  now+=10001; assert.equal(d.observe('call',{userId:12,kind:'vc_join'}).uniqueJoins,1);
});
test('baseline learns quiet bins, freezes raid bins, and high-cardinality observations remain bounded', () => {
  let now=0; const config={...loadConfig({}, {requireToken:false}),maxUsers:100,maxGroups:2};
  const d=new VoiceBurstDetector(config,()=>now);
  for(let bin=0;bin<10;bin++) for(let i=0;i<6;i++) { now=bin*10000+i*100; d.observe('a',{userId:i,kind:'vc_join'}); }
  const before=d.calls.get('a').mean; assert.ok(before>0);
  now=100000;
  for(let i=0;i<300;i++) d.observe('a',{userId:i,kind:'vc_join'});
  assert.ok(d.calls.get('a').joins.size<=100); assert.ok(d.calls.get('a').transitions.length-d.calls.get('a').head<=100);
  const after=d.calls.get('a').mean; now=110001; d.observe('a',{userId:300,kind:'vc_join'});
  assert.equal(d.calls.get('a').mean,after);
  d.observe('b',{userId:1,kind:'vc_join'});d.observe('c',{userId:1,kind:'vc_join'}); assert.equal(d.calls.size,2);
});
function fixture(t,mode='enforce') {
  const store=new Store(':memory:');t.after(()=>store.close());
  const config={...loadConfig({}, {requireToken:false}),mtAllowedChats:new Set(['-1001']),vcRaidUniqueJoins:3};
  const call=new Api.InputGroupCall({id:bigInt(77),accessHash:bigInt(88)}),requests=[],processed=[];
  const state={authorized:true,fail:false,alerts:0};
  store.setGroup('-1001',{chatType:'channel',vc:true,vcShield:true,vcGuard:false,mode,vcRotateInvites:false});
  const client={connected:true,getInputEntity:async()=>new Api.InputPeerChannel({channelId:bigInt(1),accessHash:bigInt(2)}),invoke:async r=>{
    requests.push(r);
    if(r instanceof Api.channels.GetParticipant) return {participant:state.authorized?new Api.ChannelParticipantCreator({userId:bigInt(9)}):new Api.ChannelParticipant({userId:bigInt(9),date:1})};
    if(r instanceof Api.phone.ToggleGroupCallSettings && state.fail) throw new Error('RPC failed');
    if(r instanceof Api.channels.GetFullChannel) return {fullChat:{call}};
    if(r instanceof Api.phone.GetGroupCall) return {call:new Api.GroupCall({id:bigInt(77),accessHash:bigInt(88),version:1,participantsCount:0,unmutedVideoLimit:10})};
    return {};
  }};
  const adapter=new VoiceAdapter({config,store,client,queue:new SerialQueue(),engine:{process:async e=>processed.push(e),notifyVoiceIncident:async()=>state.alerts++}});
  adapter.budget={allow:()=>true,pause(){}};
  adapter.calls.set('77',{chatId:'-1001',call,checkedAt:Date.now(),synchronizedAt:Date.now(),joinMuted:false}); adapter.normalizer.reset(77,1);
  const joins=async()=> {
    for(let i=0;i<3;i++) await adapter.handle(new Api.UpdateGroupCallParticipants({call,version:i+2,participants:[new Api.GroupCallParticipant({peer:new Api.PeerUser({userId:bigInt(i+1)}),date:1,source:i+1,justJoined:true,versioned:true})]}));
  };
  return {adapter,store,config,call,requests,processed,state,joins};
}
test('collective enforcement changes only call admission, never mutes/bans a quiet individual',async t=>{
  const f=fixture(t);await f.joins();
  assert.equal(f.processed.length,3);assert.equal(f.state.alerts,1);
  assert.equal(f.requests.filter(r=>r instanceof Api.phone.ToggleGroupCallSettings && r.joinMuted===true).length,1);
  assert.equal(f.requests.some(r=>r instanceof Api.phone.EditGroupCallParticipant),false);
  assert.ok(f.store.incidents('-1001').some(r=>r.action==='vc-admission-acknowledged'));
});

test('manual call termination binds a confirmed call, freshly verifies rights and separates intent from acknowledgement',async t=>{
  const f=fixture(t);const settings=f.store.group('-1001');
  await assert.rejects(f.adapter.endCall('-1001',settings,'78'),/no longer current/);
  f.state.authorized=false;await assert.rejects(f.adapter.endCall('-1001',settings,'77'),/rights/);
  assert.equal(f.requests.some(r=>r instanceof Api.phone.DiscardGroupCall),false);
  f.state.authorized=true;await f.adapter.endCall('-1001',settings,'77');
  assert.equal(f.requests.filter(r=>r instanceof Api.phone.DiscardGroupCall).length,1);assert.equal(f.adapter.entry('-1001'),undefined);
  assert.ok(f.store.incidents('-1001').some(r=>r.action==='vc-end-acknowledged'));
});

test('failed termination never records acknowledgement; a remote replacement call is preserved',async t=>{
  const f=fixture(t),invoke=f.adapter.client.invoke;
  f.adapter.client.invoke=async request=> {
    if(request instanceof Api.channels.GetFullChannel)return{fullChat:{call:new Api.InputGroupCall({id:bigInt(78),accessHash:bigInt(88)})}};
    return invoke(request);
  };
  await assert.rejects(f.adapter.endCall('-1001',f.store.group('-1001'),'77'),/changed/);
  assert.equal(f.requests.some(r=>r instanceof Api.phone.DiscardGroupCall),false);
  f.adapter.client.invoke=async request=>{if(request instanceof Api.phone.DiscardGroupCall)throw new Error('failed');return invoke(request);};
  await assert.rejects(f.adapter.endCall('-1001',f.store.group('-1001'),'77'),/failed/);
  assert.ok(f.adapter.entry('-1001'));assert.equal(f.store.incidents('-1001').some(r=>r.action==='vc-end-acknowledged'),false);
});
test('observe, revoked rights and failed acknowledgement never report successful shield mutation',async t=>{
  const f=fixture(t,'observe');await f.joins();assert.equal(f.requests.length,0);
  f.state.authorized=false;
  await assert.rejects(f.adapter.setAdmission('-1001',true,f.store.group('-1001'),'manual'),/rights/);
  f.state.authorized=true;f.state.fail=true;
  await assert.rejects(f.adapter.setAdmission('-1001',true,f.store.group('-1001'),'manual'),/RPC failed/);
  assert.equal(f.store.incidents('-1001').some(r=>r.action==='vc-admission-acknowledged'),false);
});
test('speaking-invite rotation is explicit opt-in and serializes through the real TL request',async t=>{
  const f=fixture(t);const settings={...f.store.group('-1001'),vcRotateInvites:true};
  await f.adapter.setAdmission('-1001',true,settings);
  const r=f.requests.find(r=>r instanceof Api.phone.ToggleGroupCallSettings);assert.equal(r.resetInviteHash,true);assert.ok(r.getBytes().length>16);
  f.requests.length=0;await f.adapter.setAdmission('-1001',false,settings);
  const open=f.requests.find(r=>r instanceof Api.phone.ToggleGroupCallSettings);assert.equal(open.joinMuted,false);assert.equal(Boolean(open.resetInviteHash),false);
});
test('preemptive guard also applies to a previously discovered current call, only in enforce mode',async t=>{
  const f=fixture(t);f.store.setGroup('-1001',{...f.store.group('-1001'),vcGuard:true});
  await f.adapter.refresh();assert.ok(f.requests.some(r=>r instanceof Api.phone.ToggleGroupCallSettings && r.joinMuted===true));
  f.requests.length=0;await f.adapter.refresh();assert.equal(f.requests.some(r=>r instanceof Api.phone.ToggleGroupCallSettings),false);
  f.adapter.entry('-1001').joinMuted=false;f.store.setGroup('-1001',{...f.store.group('-1001'),mode:'observe'});
  await f.adapter.refresh();assert.equal(f.requests.some(r=>r instanceof Api.phone.ToggleGroupCallSettings),false);
});

test('an observe alert does not consume the enforcement action cooldown after a deliberate mode change',async t=>{
  const f=fixture(t,'observe');await f.joins();assert.equal(f.requests.length,0);
  f.store.setGroup('-1001',{...f.store.group('-1001'),mode:'enforce'});
  await f.adapter.handle(new Api.UpdateGroupCallParticipants({call:f.call,version:5,participants:[new Api.GroupCallParticipant({peer:new Api.PeerUser({userId:bigInt(4)}),date:1,source:4,justJoined:true,versioned:true})]}));
  assert.ok(f.requests.some(r=>r instanceof Api.phone.ToggleGroupCallSettings));
});
