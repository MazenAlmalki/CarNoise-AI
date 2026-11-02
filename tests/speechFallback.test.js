import test from 'node:test';
import assert from 'node:assert/strict';
import {speechFallbackConfiguration,acceptedSpeechSegments,transcribeWithGroq} from '../server/speechFallback.js';
import {analyzeUploadedMedia} from '../server/multimodal.js';
import {execFileSync} from 'node:child_process';
const env={GEMINI_REFERENCE_AUDIO:'0',AUDIO_PROVIDER:'gemini',GEMINI_API_KEY:'gemini-fixture-key',GEMINI_AUDIO_MODEL:'gemini-fixture',GEMINI_AUDIO_MAX_SECONDS:'2',CHAT_API_URL:'https://api.groq.com/openai/v1/chat/completions',CHAT_API_KEY:'groq-fixture-key',ENABLE_AUDIO_CLAP:'0',ENABLE_SPEECH_TRANSCRIPTION:'0'};
function wav(){const b=Buffer.alloc(32044);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(32000,40);for(let i=0;i<16000;i++)b.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*400/16000)*4000),44+i*2);return b;}
const segment=text=>({text,no_speech_prob:0.02,avg_logprob:-0.15});
const speech=(text='السلام عليكم')=>({ok:true,json:async()=>({language:'arabic',segments:[segment(text)]})});
let ffmpeg=false;try{execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-version'],{stdio:'ignore'});ffmpeg=true;}catch{}

test('auto reuses only a genuine Groq chat configuration and never forwards another provider key',()=>{
 assert.equal(speechFallbackConfiguration(env).provider,'groq');
 assert.equal(speechFallbackConfiguration({...env,CHAT_API_URL:'https://openrouter.ai/api/v1/chat/completions'}).provider,'none');
 assert.equal(speechFallbackConfiguration({...env,CHAT_API_URL:'https://api.groq.com.attacker.invalid/path'}).provider,'none');
 assert.equal(speechFallbackConfiguration({...env,SPEECH_FALLBACK:'none'}).provider,'none');
 assert.equal(speechFallbackConfiguration({ENABLE_SPEECH_TRANSCRIPTION:'1'}).provider,'local');
 assert.ok(!JSON.stringify(speechFallbackConfiguration(env)).includes(env.CHAT_API_KEY));
});

test('Arabic and English transcripts stay in the original language; UI language does not constrain detection',async()=>{
 for(const text of ['السيارة ترج وهي واقفة','The car shakes at idle']){
  const result=await transcribeWithGroq(wav(),{env,fetchImpl:async(url,request)=>{
   assert.equal(url,'https://api.groq.com/openai/v1/audio/transcriptions');assert.equal(request.headers.Authorization,'Bearer '+env.CHAT_API_KEY);
   assert.equal(request.body.get('language'),null);assert.equal(request.body.get('response_format'),'verbose_json');assert.equal(request.body.get('timestamp_granularities[]'),'segment');
   assert.equal(request.body.get('file').type,'audio/wav');return speech(text);
  }});
  assert.equal(result.text,text);assert.equal(result.hasRecognizedSpeech,true);assert.ok(!JSON.stringify(result).includes(env.CHAT_API_KEY));
 }
});

test('silence, uncertain and unscored segments do not become words',()=>{
 assert.equal(acceptedSpeechSegments([{text:'invented',no_speech_prob:0.9,avg_logprob:-0.1},{text:'unclear',no_speech_prob:0.02,avg_logprob:-2},{text:'unscored'}]),'');
 assert.equal(acceptedSpeechSegments([segment('hello'),segment('مرحبا')]),'hello مرحبا');
});

test('ASR access and quota failures do not leak provider messages or keys',async()=>{
 for(const status of [401,403,429,503])await assert.rejects(()=>transcribeWithGroq(wav(),{env,fetchImpl:async()=>({ok:false,status,json:async()=>({error:env.CHAT_API_KEY})})}),error=>error.message.includes('HTTP '+status)&&!error.message.includes(env.CHAT_API_KEY));
 await assert.rejects(()=>transcribeWithGroq(wav(),{env:{CHAT_API_URL:'https://openrouter.ai',CHAT_API_KEY:'must-not-use'},fetchImpl:async()=>{throw Error('must not call');}}),/configure GROQ_API_KEY/);
});

test('a Gemini failure still yields a separate successful speech transcript through Groq',{skip:!ffmpeg&&'FFmpeg unavailable'},async()=>{
 const requests=[];const bytes=wav();
 const result=await analyzeUploadedMedia({mimetype:'audio/wav',size:bytes.length,buffer:bytes},'en',{env,fetchImpl:async(url)=>{requests.push(url);return url.includes('generativelanguage.googleapis.com')?{ok:false,status:429}:speech();}});
 assert.equal(requests.length,2);assert.equal(result.audioEventAnalysis.succeeded,false);
 assert.equal(result.transcription.text,'السلام عليكم');assert.equal(result.speechTranscriptionAnalysis.provider,'groq');assert.equal(result.speechTranscriptionAnalysis.succeeded,true);
 assert.equal(result.waveform.ok,true);assert.equal(result.audioObservation,null);
});

test('clear sound events do not invoke unnecessary speech fallback; failed ASR never claims speech',{skip:!ffmpeg&&'FFmpeg unavailable'},async()=>{
 const bytes=wav();let calls=0;
 const result=await analyzeUploadedMedia({mimetype:'audio/wav',size:bytes.length,buffer:bytes},'ar',{env,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({hasSpeech:false,transcript:'',hasClearSound:true,sounds:['طقطقة'],description:'طقطقة مسموعة',uncertainty:'المصدر غير معلوم'})}]}}]})};}});
 assert.equal(calls,1);assert.equal(result.speechTranscriptionAnalysis.attempted,false);
 const failure=await analyzeUploadedMedia({mimetype:'audio/wav',size:bytes.length,buffer:bytes},'ar',{env,fetchImpl:async()=>({ok:false,status:429})});
 assert.equal(failure.transcription,null);assert.equal(failure.speechTranscriptionAnalysis.succeeded,false);assert.match(failure.warnings.join(' '),/Speech.*429/);
});
