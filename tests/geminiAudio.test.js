import test from 'node:test';
import assert from 'node:assert/strict';
import {audioProviderConfiguration,publicAudioConfiguration,describeAudioWav,hasHostedAudioEvidence} from '../server/geminiAudio.js';
import {analyzeUploadedMedia} from '../server/multimodal.js';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

let ffmpegReady=false;
try{execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-version'],{stdio:'ignore'});ffmpegReady=true;}catch{}
const ffmpegTest={skip:ffmpegReady?false:'FFmpeg is not installed; only optional media integration checks are skipped.'};

const env={AUDIO_PROVIDER:'gemini',GEMINI_API_KEY:'unit-test-key',GEMINI_AUDIO_MODEL:'gemini-test-audio',GEMINI_AUDIO_MAX_SECONDS:'2',ENABLE_AUDIO_CLAP:'1',AUDIO_PYTHON:'must-not-run-python'};
const observation={hasSpeech:false,transcript:'',hasClearSound:true,description:'A repeated high-pitched squeal is audible.',sounds:['high-pitched squeal'],uncertainty:'The source cannot be identified from this recording.'};
const response=value=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]})});
function wav(seconds=1){
 const buf=Buffer.alloc(44+16000*seconds*2);
 buf.write('RIFF');buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(16000,24);buf.writeUInt32LE(32000,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(buf.length-44,40);
 for(let i=0;i<16000*seconds;i++)buf.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/16000)*4000),44+2*i);
 return buf;
}

test('Gemini is opt-in and public configuration never includes a key',()=>{
 assert.equal(audioProviderConfiguration({}).provider,'local');
 assert.equal(audioProviderConfiguration(env).provider,'gemini');
 assert.equal(publicAudioConfiguration(env).configured,true);
 assert.equal(publicAudioConfiguration({AUDIO_PROVIDER:'gemini'}).configured,false);
 assert.ok(!JSON.stringify(publicAudioConfiguration(env)).includes(env.GEMINI_API_KEY));
 assert.throws(()=>audioProviderConfiguration({...env,GEMINI_AUDIO_MAX_SECONDS:'120'}),/between 1 and 60/);
 assert.throws(()=>audioProviderConfiguration({...env,GEMINI_AUDIO_MODEL:'../../other'}),/Invalid/);
 assert.throws(()=>audioProviderConfiguration({AUDIO_PROVIDER:'typo'}),/must be/);
});

test('sends actual WAV bytes with header authentication and separates observations from CLAP',async()=>{
 let request;
 const result=await describeAudioWav(wav(),'en',{env,fetchImpl:async(url,options)=>{request={url,options};return response(observation);}});
 assert.match(request.url,/\/models\/gemini-test-audio:generateContent$/);
 assert.ok(!request.url.includes(env.GEMINI_API_KEY));
 assert.equal(request.options.headers['x-goog-api-key'],env.GEMINI_API_KEY);
 const body=JSON.parse(request.options.body);
 assert.equal(body.contents[0].parts[1].inlineData.mimeType,'audio/wav');
 assert.deepEqual(Buffer.from(body.contents[0].parts[1].inlineData.data,'base64'),wav());
 assert.match(body.contents[0].parts[0].text,/not vehicle faults/);
 assert.equal(result.observation.diagnosisConfirmed,false);
 assert.equal(result.observation.source,'hosted_audio_observation_not_diagnosis');
 assert.equal(result.transcription.hasRecognizedSpeech,false);
 assert.ok(!JSON.stringify(result).includes(env.GEMINI_API_KEY));
 assert.equal(result.observation.matches,undefined);
});

test('preserves Arabic speech; does not invent speech or force silence into sound candidates',async()=>{
 const result=await describeAudioWav(wav(),'ar',{env,fetchImpl:async()=>response({...observation,hasSpeech:true,transcript:'السلام عليكم',hasClearSound:false,sounds:[]})});
 assert.equal(result.transcription.text,'السلام عليكم');
 assert.equal(result.transcription.hasRecognizedSpeech,true);
 assert.deepEqual(result.observation.sounds,[]);
 assert.equal(hasHostedAudioEvidence({audioObservation:result.observation,audioEventAnalysis:{provider:'gemini',succeeded:true}}),false);
});

test('missing keys and invalid inputs never invoke the provider',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw Error('unexpected call');};
 await assert.rejects(()=>describeAudioWav(wav(),'en',{env:{},fetchImpl}),/GEMINI_API_KEY/);
 await assert.rejects(()=>describeAudioWav(Buffer.from('not audio'),'en',{env,fetchImpl}),/normalized WAV/);
 assert.equal(calls,0);
});

test('quota, denied access, missing models, timeouts and blocked/malformed responses fail clearly without echoing secrets',async()=>{
 for(const [status,pattern] of [[429,/quota/],[403,/denied/],[404,/model unavailable/],[503,/temporarily/]]){
  await assert.rejects(()=>describeAudioWav(wav(),'en',{env,fetchImpl:async()=>({ok:false,status,json:async()=>({error:{message:env.GEMINI_API_KEY}})})}),error=>pattern.test(error.message)&&!error.message.includes(env.GEMINI_API_KEY));
 }
 await assert.rejects(()=>describeAudioWav(wav(),'en',{env,fetchImpl:async()=>{throw new DOMException('secret diagnostic','TimeoutError');}}),/timed out/);
 await assert.rejects(()=>describeAudioWav(wav(),'en',{env,fetchImpl:async()=>({ok:true,json:async()=>({promptFeedback:{blockReason:'SAFETY'}})})}),/did not return/);
 await assert.rejects(()=>describeAudioWav(wav(),'en',{env,fetchImpl:async()=>response({...observation,hasSpeech:true,transcript:''})}),/incomplete/);
 await assert.rejects(()=>describeAudioWav(wav(),'en',{env,fetchImpl:async()=>response({...observation,sounds:[123]})}),/incomplete/);
});

test('real audio decoding feeds Gemini and bypasses local CLAP even when its old flag is enabled',ffmpegTest,async()=>{
 let called=0;
 const bytes=wav(3);
 const result=await analyzeUploadedMedia({mimetype:'audio/wav',size:bytes.length,buffer:bytes},'en',{env,fetchImpl:async(url,options)=>{
  called++;const part=JSON.parse(options.body).contents[0].parts[1];const normalized=Buffer.from(part.inlineData.data,'base64');
  assert.equal(normalized.toString('ascii',0,4),'RIFF');assert.ok(normalized.length<65000,'excerpt capped to two seconds');return response(observation);
 }});
 assert.equal(called,1);assert.equal(result.waveform.ok,true);
 assert.equal(result.audio,null);assert.equal(result.audioEventAnalysis.provider,'gemini');assert.equal(result.audioEventAnalysis.succeeded,true);
 assert.equal(hasHostedAudioEvidence(result),true);assert.equal(result.audioObservation.excerptLimitSeconds,2);
});

test('Gemini failure retains waveform fallback and never reports successful audio recognition',ffmpegTest,async()=>{
 const bytes=wav();const result=await analyzeUploadedMedia({mimetype:'audio/wav',size:bytes.length,buffer:bytes},'en',{env,fetchImpl:async()=>({ok:false,status:429})});
 assert.equal(result.waveform.ok,true);assert.equal(result.audioObservation,null);
 assert.equal(result.audioEventAnalysis.attempted,true);assert.equal(result.audioEventAnalysis.succeeded,false);
 assert.match(result.warnings.join(' '),/Gemini.*quota/);assert.equal(hasHostedAudioEvidence(result),false);
});

test('extracts video audio for Gemini even if the separate vision provider is unavailable',ffmpegTest,async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'warshatak-gemini-test-'));
 try{
  const file=path.join(temp,'sample.mp4');
  execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=black:s=160x120:r=1','-f','lavfi','-i','sine=frequency=440:sample_rate=16000','-t','1','-c:v','mpeg4','-c:a','aac','-shortest','-y',file]);
  const bytes=await readFile(file);
  const result=await analyzeUploadedMedia({mimetype:'video/mp4',size:bytes.length,buffer:bytes},'en',{env,fetchImpl:async()=>response(observation)});
  assert.equal(result.type,'video');assert.equal(result.audioEventAnalysis.succeeded,true);assert.equal(result.waveform.ok,true);
  assert.equal(result.visual,null);assert.match(result.warnings.join(' '),/frames could not be analyzed/);
 }finally{await rm(temp,{recursive:true,force:true});}
});
