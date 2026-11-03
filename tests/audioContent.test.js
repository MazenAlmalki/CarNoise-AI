import test from 'node:test';
import assert from 'node:assert/strict';
import {audioContent,nonMechanicalMediaReply,AUDIO_CONTENT_TYPES} from '../server/audioContent.js';
import {describeAudioWav} from '../server/geminiAudio.js';
const bytes=Buffer.alloc(46);bytes.write('RIFF');bytes.write('WAVE',8);
test('all seven content types come from validated audio-provider responses, never waveform labels',async()=>{
 for(const type of AUDIO_CONTENT_TYPES){
  const speech=['speech','mixed'].includes(type),clear=['mechanical_sound','mixed','music','other'].includes(type);
  const result=await describeAudioWav(bytes,'en',{env:{GEMINI_API_KEY:'fixture',GEMINI_AUDIO_MODEL:'fixture'},fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({hasMechanicalSound:['mechanical_sound','mixed'].includes(type),contentType:type,hasSpeech:speech,transcript:speech?'My car makes a noise':'',hasClearSound:clear,description:'An unverified observation',sounds:clear?['an audible event']:[],uncertainty:'Source not established'})}]}}]})})});
  const media={audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:true},audioObservation:result.observation,transcription:result.transcription};
  assert.equal(audioContent(media).type,type);assert.equal(audioContent(media).verified,false);
  if(!['mechanical_sound','mixed'].includes(type))assert.equal(nonMechanicalMediaReply(media,'en').audioInterview,undefined);
 }
 const wave=audioContent({waveform:{kind:'waveform_features_only',label:'engine'},audio:{matches:[{label:'engine',score:0.99}]}});
 assert.equal(wave.type,'uncertain');assert.equal(wave.status,'unavailable');
 const speechOnlyASR=audioContent({transcription:{hasRecognizedSpeech:true,text:'Hello'}});assert.equal(speechOnlyASR.type,'uncertain');assert.equal(speechOnlyASR.speechPresent,true);
 const failed=audioContent({audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:false},audioObservation:{provider:'gemini',contentType:'mechanical_sound'}});assert.equal(failed.type,'uncertain');assert.equal(failed.status,'failed');
});

test('contradictory content flags cannot turn music, speech or silence into mechanical evidence',async()=>{
 for(const type of ['speech','music','silence','other','uncertain']){
  await assert.rejects(describeAudioWav(bytes,'en',{env:{GEMINI_API_KEY:'fixture',GEMINI_AUDIO_MODEL:'fixture'},fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({contentType:type,hasMechanicalSound:true,hasSpeech:false,transcript:'',hasClearSound:true,description:'Contradictory output',sounds:['engine'],uncertainty:'Unverified'})}]}}]})})}),/incomplete/);
 }
});
