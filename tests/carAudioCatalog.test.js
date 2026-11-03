import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const library=JSON.parse(readFileSync(new URL('../data/car_audio_captions_v2.json',import.meta.url),'utf8'));
const script=readFileSync(new URL('../scripts/analyze_car_audio.py',import.meta.url),'utf8');
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('extended sound catalog has independent candidates with source disclaimers',()=>{
 assert.equal(library.length,67);
 assert.equal(new Set(library.map(x=>x.id)).size,67);
 assert.ok(library.every(x=>x.classification_scope==='audio_event_similarity_only_not_mechanic_verified'));
 assert.ok(library.every(x=>x.origin==='curated_caption_not_from_youtube_link'));
 assert.ok(library.every(x=>typeof x.caption_en==='string'&&x.caption_en.length>25));
});

test('car noises cover broad sound groups plus talking and silence',()=>{
 const ids=new Set(library.map(x=>x.id));
 for(const name of ['engine_ticking','engine_knock','engine_rattle','starter_click','belt_squeal','brake_squeal','brake_grind','wheel_bearing_hum','tire_thump','suspension_clunk','transmission_whine','exhaust_rattle','car_horn','people_talking','silence'])assert.ok(ids.has(name),name);
});

test('classifier evaluates up to 20 seconds with separate windows',()=>{
 assert.match(script,/MAX_SECONDS = 20/);
 assert.match(script,/WINDOW_SECONDS = 10/);
 assert.match(script,/def audio_windows/);
 assert.match(script,/rank_matches\(comparisons, candidates\)/);
 assert.match(script,/sound_identified": False/);
 assert.match(script,/requires_confirmation": True/);
});

test('chat honestly distinguishes disabled recognition, no usable sound and provider failure',async t=>{
 const probe=http.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
 const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const child=spawn(process.execPath,['server/index.js'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,PORT:String(port),CHAT_API_KEY:'',GEMINI_API_KEY:''},stdio:['ignore','ignore','pipe']});
 t.after(()=>{child.kill();});
 const base='http://127.0.0.1:'+port;
 let ready=false;
 for(let n=0;n<60;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 assert.ok(ready,'test server must become ready');
 for(const [attempted,succeeded,status] of [[false,false,'classifier-not-configured'],[true,true,'no-candidates'],[true,false,'classifier-error']]){
  const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Analyze the recording',language:'en',mediaInsight:{type:'audio',waveform:{ok:true,kind:'waveform_features_only'},audioEventAnalysis:{provider:'gemini',attempted,succeeded},audioObservation:succeeded?{provider:'gemini',contentType:'uncertain',hasClearSound:false}:null,transcription:{hasRecognizedSpeech:false,text:''},warnings:['Gemini audio analysis failed: quota reached.']}})});
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.audioStatus,status);assert.equal(result.audioInterview,undefined);
  assert.match(result.reply,/not configured|cannot tell|could not reliably/i);
  assert.doesNotMatch(result.reply,/your (?:engine|brakes|battery) (?:is|are|has|have)|I (?:heard|recognized|diagnosed)/i);
  assert.ok(!result.knowledgeMatches?.length,'failed/no sound must not fabricate retrieved diagnoses');
  if(!attempted){assert.equal(result.grounding,'audio-content-routing');assert.equal(result.clarificationOptions,undefined);}
  if(status==='classifier-error')assert.match(result.audioError,/quota/);
 }
});
