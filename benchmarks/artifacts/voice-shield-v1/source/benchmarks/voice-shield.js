import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../config.js';
import { VoiceBurstDetector } from '../voiceShield.js';
import { AntiFlood } from '../antiFlood.js';

const config=loadConfig({}, {requireToken:false});
const scenarios=[
  {name:'spaced-benign-joins',interval:2500,unique:true,label:'benign'},
  {name:'distributed-join-burst',interval:150,unique:true,label:'synthetic-attack'},
  {name:'legitimate-audience-surge',interval:150,unique:true,label:'benign'},
  {name:'slow-distributed-joins',interval:1000,unique:true,label:'synthetic-attack'},
  {name:'single-user-call-churn',interval:100,unique:false,label:'synthetic-attack'},
  {name:'hidden-media-with-spaced-joins',interval:2500,unique:true,label:'synthetic-attack'}
];
const rows=[];
for(const s of scenarios) {
  let now=0;const old=new AntiFlood(config,()=>now),shield=new VoiceBurstDetector(config,()=>now);
  let individual=null,collective=null;
  for(let i=0;i<30;i++) {
    now=i*s.interval; const event={chatId:-1001,userId:s.unique?i+1:1,kind:s.unique||i%2===0?'vc_join':'vc_leave'};
    if(old.observe(event).attack && individual===null) individual=now;
    if(shield.observe('call',event)?.suspicious && collective===null) collective=now;
  }
  rows.push({scenario:s.name,label:s.label,events:30,individualFlag:individual!==null,collectiveFlag:collective!==null,
    firstIndividualVirtualMs:individual,firstCollectiveVirtualMs:collective});
}
const output={evidence:'Deterministic synthetic event replay only; no Telegram API, media packets, audio quality or actual mitigation measurement.',
  generator:'30 events; specified fixed intervals and identity pattern; fresh state per scenario',
  config:{windowSeconds:config.vcRaidWindowSeconds,uniqueJoinFloor:config.vcRaidUniqueJoins,baselineMultiplier:config.vcRaidBaselineMultiplier},rows};
mkdirSync('benchmarks/results',{recursive:true});
writeFileSync('benchmarks/results/voice-shield.json',JSON.stringify(output,null,2)+'\n');
console.table(rows);console.log(output.evidence);
