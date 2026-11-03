import test from 'node:test';
import assert from 'node:assert/strict';
import {buildUnifiedCase,isMediaOnlyRequest} from '../server/unifiedCase.js';
import {findSaudiUsageTerms} from '../server/saudiUsageTerms.js';
import {selectedVehicleContext} from '../server/vehicleContext.js';
import {validateMedia,MAX_MEDIA_BYTES,MEDIA_FORMATS} from '../public/media-formats.js';
const media={type:'video',transcription:{hasRecognizedSpeech:true,text:'There is no sound when braking'},audioEventAnalysis:{succeeded:true},audioObservation:{description:'A squeal may be audible',sounds:['squeal']},visual:{description:'A wheel is visible'},waveform:{}};
test('detailed media-prefixed descriptions are never replaced by ASR',()=>{
 for(const message of ['Analyze the recording. My brakes squeal when braking, but only after a long drive.','حلل المقطع، السيارة تصفر عند الفرامل بعد مشوار طويل']){
  const record=buildUnifiedCase({message,mediaInsight:media});
  assert.equal(record.effectiveMessage,message);assert.equal(record.writtenDescription,message);
  assert.equal(record.transcript.text,media.transcription.text);assert.equal(record.transcript.verified,false);
 }
 assert.equal(isMediaOnlyRequest('Analyze the attachment and explain only observations and limitations.'),true);
 assert.equal(buildUnifiedCase({message:'Analyze the recording',mediaInsight:media}).effectiveMessage,media.transcription.text);
});
test('one bounded record separates text, model observations, transcript, history and vehicle',()=>{
 const record=buildUnifiedCase({message:'My brakes squeal when braking',messages:[{role:'assistant',content:'Confirmed faulty brake pads'},{role:'user',content:'It happens after warming up'}],mediaInsight:media,vehicle:{name:'Camry',year:2018},vehicleHistory:[{description:'A previous vibration',suspectedSummary:'A guess'}]});
 assert.equal(record.vehicle.year,2018);assert.equal(record.media.type,'video');assert.equal(record.media.audio.verified,false);assert.equal(record.media.visual.verified,false);assert.equal(record.history[0].verified,false);
 assert.deepEqual(record.userStatements,['It happens after warming up']);assert.equal(record.possibleConflicts[0].status,'possible_conflict');assert.equal(record.possibleConflicts[0].verified,false);
 assert.equal(buildUnifiedCase({message:'My brakes squeal when braking',mediaInsight:{...media,audioEventAnalysis:{succeeded:false}}}).media.audio,null);
 assert.deepEqual(buildUnifiedCase({message:'A sound at idle',mediaInsight:media}).possibleConflicts,[]);
 assert.doesNotThrow(()=>buildUnifiedCase({messages:{},vehicleHistory:{},mediaInsight:{audioObservation:{sounds:{}},audioEventAnalysis:{succeeded:true}}}));
});
test('latest user vehicle and year corrections survive follow-ups without copying an old model year',()=>{
 let vehicle=selectedVehicleContext({name:'Camry 2018'},'It gets louder',["I meant my car is a Corolla 2021"]);
 assert.equal(vehicle.modelId,'toyota-corolla');assert.equal(vehicle.year,2021);
 vehicle=selectedVehicleContext({name:'Camry 2018'},'It gets louder',['I meant my car is a Corolla']);
 assert.equal(vehicle.modelId,'toyota-corolla');assert.equal(vehicle.year,null);
 vehicle=selectedVehicleContext({name:'Camry 2018'},'لا قصدي موديلها ٢٠٢٠');assert.equal(vehicle.year,2020);
 vehicle=selectedVehicleContext({name:'Camry',year:2018},'I passed a Corolla 2022');assert.equal(vehicle.modelId,'toyota-camry');assert.equal(vehicle.year,2018);
 vehicle=selectedVehicleContext({name:'Camry 2018'},'I meant not a Corolla');assert.equal(vehicle.modelId,'toyota-camry');
});
test('usage terms are lexical hints without substring diagnosis guesses',()=>{
 assert.deepEqual(findSaudiUsageTerms('مساعدة العميل'),[]);
 assert.ok(findSaudiUsageTerms('القير ينتع والفحمات تصفر').some(t=>t.meaning_en==='transmission'));
 assert.ok(findSaudiUsageTerms('طرمبة').every(t=>t.diagnosisConfirmed===false));
});
test('shared formats reject unsupported, empty and oversized files and normalize recorder codecs',()=>{
 for(const type of Object.keys(MEDIA_FORMATS))assert.equal(validateMedia({type,size:10}).ok,true);
 assert.equal(validateMedia({type:'audio/webm;codecs=opus',size:100}).mime,'audio/webm');
 assert.equal(validateMedia({type:'image/svg+xml',size:50}).ok,false);
 assert.equal(validateMedia({type:'audio/wav',size:0}).ok,false);
 assert.equal(validateMedia({type:'audio/wav',size:MAX_MEDIA_BYTES+1}).error,'too-large');
 assert.equal(validateMedia({type:'audio/wav',size:MAX_MEDIA_BYTES}).ok,true);
});

test('sound observations can conflict with written reports without verifying either source',()=>{
 const record=buildUnifiedCase({message:'There is no squeal when braking',mediaInsight:media});
 assert.ok(record.possibleConflicts.some(x=>x.sources.includes('model_audio_observation')));
 assert.ok(record.possibleConflicts.every(x=>!x.verified));
});

test('vehicle corrections are retained after they leave the recent message window',async()=>{
 const {summarizeQuestionMemory,mergeQuestionMemory}=await import('../public/questionMemory.js');
 const turns=[{role:'user',content:'I meant my car is a Corolla 2021'},...Array.from({length:20},()=>({role:'user',content:'It still happens'}))];
 const memory=mergeQuestionMemory(turns.slice(-10),summarizeQuestionMemory(turns));
 const record=buildUnifiedCase({message:'It gets louder',messages:turns.slice(-10),vehicleStatements:memory.vehicleStatements,vehicle:{name:'Camry 2018'}});
 assert.equal(record.vehicle.modelId,'toyota-corolla');assert.equal(record.vehicle.year,2021);
});

test('upload progress comes only from measurable browser bytes and cancellation rejects',async()=>{
 const {uploadMedia}=await import('../public/media-upload.js');
 const prior=globalThis.XMLHttpRequest;let xhr;
 class FakeRequest {constructor(){xhr=this;this.upload={};}open(){}send(){}abort(){this.onabort();}}
 globalThis.XMLHttpRequest=FakeRequest;
 try{
  const progress=[];let uploaded=false;
  const pending=uploadMedia({}, {onProgress:p=>progress.push(p.percent),onUploaded:()=>uploaded=true});
  xhr.upload.onprogress({lengthComputable:false,loaded:8,total:0});assert.deepEqual(progress,[]);
  xhr.upload.onprogress({lengthComputable:true,loaded:25,total:100});assert.deepEqual(progress,[25]);assert.equal(uploaded,false);
  xhr.upload.onload();assert.equal(uploaded,true);xhr.status=200;xhr.response={analysis:{}};xhr.onload();assert.equal((await pending).ok,true);
  const controller=new AbortController(),cancelled=uploadMedia({}, {signal:controller.signal});controller.abort();await assert.rejects(cancelled,{name:'AbortError'});
 }finally{globalThis.XMLHttpRequest=prior;}
});

test('corrections exclude a negated former vehicle or year instead of remembering it again',()=>{
 let vehicle=selectedVehicleContext({name:'Camry 2018'},'I meant not a Camry, my car is a Corolla 2021');
 assert.equal(vehicle.modelId,'toyota-corolla');assert.equal(vehicle.year,2021);
 vehicle=selectedVehicleContext({name:'Camry 2018'},'Actually model year is not 2018, it is 2020');assert.equal(vehicle.year,2020);
 vehicle=selectedVehicleContext({name:'كامري ٢٠١٨'},'قصدي موديلها ٢٠٢٠ مو ٢٠١٨');assert.equal(vehicle.year,2020);
});

 test('preserved original complaint cannot undo a later correction from full-case memory',async()=>{
 const {summarizeQuestionMemory,mergeQuestionMemory}=await import('../public/questionMemory.js');
 const first={role:'user',content:'My car is a Camry 2018 and it shakes'};
 const turns=[first,{role:'user',content:'I meant my car is a Corolla 2021'},...Array.from({length:20},()=>({role:'user',content:'It still happens'}))];
 const bounded=[first,...turns.slice(-10)];
 const memory=mergeQuestionMemory(bounded,summarizeQuestionMemory(turns));
 const record=buildUnifiedCase({message:'What should I do next',messages:bounded,vehicleStatements:memory.vehicleStatements,vehicle:{name:'Camry 2018'}});
 assert.equal(record.vehicle.modelId,'toyota-corolla');assert.equal(record.vehicle.year,2021);
});
