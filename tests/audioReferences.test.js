import test from 'node:test';
import assert from 'node:assert/strict';
import {loadAudioReferences,validateReferenceComparison} from '../server/audioReferences.js';
import {describeAudioWithReferences} from '../server/geminiAudio.js';
import {analyzeUploadedMedia} from '../server/multimodal.js';
import {planMinimalQuestions,enforceQuestionBudget} from '../server/minimalQuestions.js';
const env={AUDIO_PROVIDER:'gemini',GEMINI_API_KEY:'fixture-only-key',GEMINI_AUDIO_MODEL:'fixture-audio-model',GEMINI_AUDIO_MAX_SECONDS:'2',SPEECH_FALLBACK:'none'};
const observation={hasSpeech:false,transcript:'',hasClearSound:true,description:'Repeated sound events are audible.',sounds:['repeated events'],uncertainty:'Sound resemblance is not a fault diagnosis.',referenceComparison:{result:'clear',referenceIds:['upload1-02'],reason:'Similar repeated high frequency events, with different background noise.'}};
const response=value=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]})});
test('all 15 actual uploaded-reference excerpts have valid hashes, bilingual source labels and real PCM audio',async()=>{
 const refs=await loadAudioReferences({});assert.equal(refs.length,15);assert.equal(new Set(refs.map(x=>x.id)).size,15);
 assert.ok(refs.every(x=>x.label_ar&&x.label_en&&!x.fault_verified&&!x.audio_reviewed_by_gemini&&x.wav.readUInt32LE(24)===16000));
 assert.ok(refs.every(x=>x.wav.subarray(44).some(byte=>byte!==0)));
 assert.deepEqual(await loadAudioReferences({GEMINI_REFERENCE_AUDIO:'0'}),[]);
});
test('Gemini receives target first and all real references without component-label priming',async()=>{
 const refs=await loadAudioReferences({});let sent;
 const result=await describeAudioWithReferences(refs[0].wav,'ar',{env,fetchImpl:async(url,request)=>{sent=JSON.parse(request.body);return response(observation);}});
 const parts=sent.contents[0].parts;assert.equal(parts.filter(x=>x.inlineData).length,16);
 assert.equal(parts[1].inlineData.data,refs[0].wav.toString('base64'));
 for(let i=0;i<refs.length;i++){assert.match(parts[2+2*i].text,new RegExp(refs[i].id));assert.equal(parts[3+2*i].inlineData.data,refs[i].wav.toString('base64'));assert.ok(!JSON.stringify(parts).includes(refs[i].label_ar));}
 assert.equal(result.observation.referenceComparison.matches[0].label_en,'Brake pads');assert.equal(result.observation.referenceComparison.diagnosisConfirmed,false);
 assert.equal(result.transcription.text,'');assert.equal(result.observation.referenceComparison.needsClarification,false);
});
test('partial/unmatched/unclear/silent targets cannot become confident component matches; invented IDs rejected',async()=>{
 const refs=await loadAudioReferences({});
 for(const status of ['partial','none','unclear']){const c=validateReferenceComparison({result:status,referenceIds:status==='partial'?[refs[0].id,refs[1].id]:[],reason:'Overlapping or insufficient evidence.'},refs,true);assert.equal(c.needsClarification,true);assert.equal(c.diagnosisConfirmed,false);}
 const silent=validateReferenceComparison(observation.referenceComparison,refs,false);assert.equal(silent.needsClarification,true);assert.deepEqual(silent.matches,[]);
 assert.throws(()=>validateReferenceComparison({...observation.referenceComparison,referenceIds:['invented']},refs,true),/Unknown/);
 await assert.rejects(()=>describeAudioWithReferences(refs[0].wav,'en',{env,fetchImpl:async()=>response({...observation,referenceComparison:{result:'clear',referenceIds:['invented'],reason:'x'}})}),/incomplete/);
});
test('real upload processing invokes reference comparison and clear resemblance suppresses reflexive questions',async()=>{
 const [reference]=await loadAudioReferences({});let count=0;
 const result=await analyzeUploadedMedia({mimetype:'audio/wav',size:reference.wav.length,buffer:reference.wav},'ar',{env,fetchImpl:async()=>{count++;return response(observation);}});
 assert.equal(count,1);assert.equal(result.audioEventAnalysis.succeeded,true);assert.equal(result.audioObservation.referenceComparison.matches.length,1);
 const plan=planMinimalQuestions({current:'Analyze the attachment',mediaRequested:true,audioObservation:result.audioObservation});assert.equal(plan.askQuestion,false);
 assert.doesNotMatch(enforceQuestionBudget('A similar reference is available. When does it happen?',plan,{language:'en'}),/\?/);
 const uncertain=planMinimalQuestions({current:'Analyze the attachment',mediaRequested:true,audioObservation:{...result.audioObservation,referenceComparison:{result:'partial',needsClarification:true}}});assert.equal(uncertain.askQuestion,true);
});
