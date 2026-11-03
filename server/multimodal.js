import {audioContent} from './audioContent.js';
import {validateMedia} from '../public/media-formats.js';
import 'dotenv/config';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { analyzeWaveform } from './audioWaveform.js';
import { describeVehicleImages } from './llamaVision.js';
import { audioProviderConfiguration, describeAudioWithReferences } from './geminiAudio.js';
import { speechFallbackConfiguration, transcribeWithGroq } from './speechFallback.js';
import { createTimings } from './timings.js';

const maxStdout=20_000;
async function runProcess(cmd,args,{timeout=40000,limit=maxStdout}={}){
 return await new Promise((resolve,reject)=>{
  const child=spawn(cmd,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeout);
  child.stdout.on('data',x=>{stdout+=x.toString('utf8');if(stdout.length>limit)child.kill('SIGKILL');});
  child.stderr.on('data',x=>{stderr=(stderr+x.toString('utf8')).slice(-2400);});
  child.on('error',e=>{clearTimeout(timer);reject(e);});
  child.on('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(new Error((stderr||'Processing failed').slice(-900)));});
 });
}
async function videoFrames(input,temp){
 const ffmpeg=process.env.FFMPEG_PATH?.trim()||'ffmpeg';
 const results=[];
 for(const [index,seconds] of [0,1].entries()){
  const output=path.join(temp,'frame-'+index+'.jpg');
  // Sample 0 and 2 seconds; clips shorter than 2s can still use frame 0.
  try{
   await runProcess(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(seconds*2),'-i',input,'-frames:v','1','-vf','scale=640:-2','-y',output],{timeout:30000});
   results.push((await readFile(output)).toString('base64'));
  }catch(error){if(!results.length)throw error;}
 }
 return results;
}
async function speechTranscription(input,language,env=process.env){
 if(env.ENABLE_SPEECH_TRANSCRIPTION!=='1')return null;
 const python=env.AUDIO_PYTHON?.trim()||(process.platform==='win32'?'python':'python3');
 const script=path.resolve('scripts','transcribe_audio.py');
 const output=await runProcess(python,[script,input,env.SPEECH_LANGUAGE||'auto'],{timeout:180000,limit:12000});
 const parsed=JSON.parse(output.trim());
 if(typeof parsed.text!=='string'||typeof parsed.hasRecognizedSpeech!=='boolean')throw Error('Invalid transcription response');
 return parsed;
}
async function audioSimilarity(input){
 const python=process.env.AUDIO_PYTHON?.trim()||(process.platform==='win32'?'python':'python3');
 const script=path.resolve('scripts','analyze_car_audio.py');
 const output=await runProcess(python,[script,input],{timeout:180000,limit:15000});
 const result=JSON.parse(output.trim());
 if(!Array.isArray(result.matches))throw new Error('Audio model response malformed.');
 return result;
}
async function audioExcerpt(source,temp,seconds,env){
 const output=path.join(temp,'audio-excerpt.wav');
 await runProcess(env.FFMPEG_PATH?.trim()||'ffmpeg',[
  '-hide_banner','-loglevel','error','-i',source,'-map','0:a:0','-vn','-t',String(seconds),
  '-ac','1','-ar','16000','-c:a','pcm_s16le','-f','wav','-y',output
 ],{timeout:40000});
 return readFile(output);
}
// Normalize a bounded excerpt locally; only the extracted audio reaches Gemini.
async function analyzeAudioTrack(source,temp,language,options){
 const env=options.env||process.env;
 const timing=createTimings();
 const warnings=[];
 let waveform=null,audio=null,transcription=null,audioObservation=null,excerpt=null;
 const speechTranscriptionAnalysis={attempted:false,provider:'none',succeeded:false};
 // Signal inspection and provider preparation are independent. Both settle
 // before temporary files are removed; failure in one cannot lose the other.
 const waveformWork=timing.measure('waveform',()=>analyzeWaveform(source,{ffmpeg:env.FFMPEG_PATH})).then(value=>{waveform=value;},error=>{warnings.push('Audio waveform unavailable: '+String(error.message).slice(0,140));});
 let config;
 try{config=audioProviderConfiguration(env);}catch(error){warnings.push(error.message);}
 const audioEventAnalysis={attempted:false,provider:config?.provider||'invalid',model:config?.provider==='gemini'?config.model:'CLAP',succeeded:false};
 if(config?.provider==='gemini'){
  audioEventAnalysis.attempted=true;
  try{
   if(!config.configured)throw Error('Gemini audio: set GEMINI_API_KEY in your server .env and restart the server.');
   excerpt=await timing.measure('normalize',()=>audioExcerpt(source,temp,config.excerptLimitSeconds,env));
   const result=await timing.measure('audioProvider',()=>describeAudioWithReferences(excerpt,language,options));
   audioObservation=result.observation;transcription=result.transcription;audioEventAnalysis.succeeded=true;
   if(config.referenceAudioEnabled)warnings.push('Bundled user-supplied reference audio excerpts were also sent to Gemini for comparison; resemblance is not a confirmed mechanical fault.');
   warnings.push('Only the first '+config.excerptLimitSeconds+' seconds at most were sent to Gemini. Hosted observations and transcripts may be wrong; no mechanical fault is confirmed.');
  }catch(error){
   if(Number.isInteger(error.httpStatus))audioEventAnalysis.httpStatus=error.httpStatus;
   warnings.push('Gemini audio analysis failed: '+String(error.message).slice(0,240));
  }
 }else{
  if(env.ENABLE_SPEECH_TRANSCRIPTION==='1'){
    try{speechTranscriptionAnalysis.attempted=true;speechTranscriptionAnalysis.provider='local';transcription=await timing.measure('transcription',()=>speechTranscription(source,language,env));speechTranscriptionAnalysis.succeeded=Boolean(transcription);}catch(error){warnings.push('Speech transcription unavailable: '+String(error.message).slice(0,140));}
  }else warnings.push('Speech was not transcribed. Optional Whisper is disabled.');
  if(config?.provider==='local'&&env.ENABLE_AUDIO_CLAP==='1'){
   audioEventAnalysis.attempted=true;
   try{audio=await timing.measure('clap',()=>audioSimilarity(source));audioEventAnalysis.succeeded=true;}
   catch(error){warnings.push('Optional CLAP unavailable: '+String(error.message).slice(0,140));}
  }else warnings.push('Sound-event classification is not configured; waveform metrics alone cannot identify sounds.');
 }
 // Recognized speech takes precedence over a failed sound classifier. Try ASR
 // only when there is neither intelligible speech nor a useful hosted sound event.
 if(transcription?.hasRecognizedSpeech&&audioEventAnalysis.provider==='gemini'){
  Object.assign(speechTranscriptionAnalysis,{attempted:true,provider:'gemini',succeeded:true});
 }
 if(!transcription?.hasRecognizedSpeech&&!audioObservation?.hasClearSound){
  try{
   const fallback=speechFallbackConfiguration(env);
   if(fallback.provider!=='none'&&!(speechTranscriptionAnalysis.attempted&&speechTranscriptionAnalysis.provider===fallback.provider)){
    speechTranscriptionAnalysis.attempted=true;speechTranscriptionAnalysis.provider=fallback.provider;
    if(!fallback.configured)throw Error('Speech transcription is not configured. Check SPEECH_FALLBACK and its credentials/dependencies.');
    if(fallback.provider==='groq'){
     excerpt=excerpt||await timing.measure('normalize',()=>audioExcerpt(source,temp,config?.excerptLimitSeconds||30,env));
     transcription=await timing.measure('transcriptionFallback',()=>transcribeWithGroq(excerpt,options));
    }else transcription=await timing.measure('transcriptionFallback',()=>speechTranscription(source,language,env));
    speechTranscriptionAnalysis.succeeded=Boolean(transcription);
   }
  }catch(error){warnings.push('Speech fallback unavailable: '+String(error.message).slice(0,240));}
 }
 await waveformWork;
 const content=audioContent({audioObservation,transcription,audioEventAnalysis});
 return {audioContent:content,audioObservation,transcription,speechTranscriptionAnalysis,audio,audioEventAnalysis,waveform,warnings,timings:timing.snapshot()};
}
export async function analyzeUploadedMedia(file,language='ar',options={}){
 const validation=validateMedia({mimetype:file?.mimetype,size:file?.buffer?.length});
 if(!validation.ok)throw new Error(validation.error==='unsupported-type'?'Unsupported media type.':'Media must contain 1 byte to 25 MB.');
 const extension=validation.extension;
 file={...file,mimetype:validation.mime};
 const temp=await mkdtemp(path.join(os.tmpdir(),'warshatak-'));
 const source=path.join(temp,'upload'+extension);
 try{
  await writeFile(source,file.buffer);
  if(file.mimetype.startsWith('image/')){
   const observed=await describeVehicleImages([{mimeType:file.mimetype,base64:file.buffer.toString('base64')}],language,options);
   return {type:'image',visual:observed,summary:observed.description,limitations:'Image is a visual observation, NOT a mechanical diagnosis.'};
  }
  if(file.mimetype.startsWith('video/')){
   // Audio and sampled frames do not depend on each other. Observe both results.
   const visualTiming=createTimings();
   const [track,frameResult]=await Promise.all([
    analyzeAudioTrack(source,temp,language,options),
    visualTiming.measure('videoVision',async()=>describeVehicleImages((await videoFrames(source,temp)).map(base64=>({mimeType:'image/jpeg',base64})),language,options)).then(visual=>({visual}),error=>({error}))
   ]);
   const visual=frameResult.visual||null;
   if(frameResult.error)track.warnings.push('Video frames could not be analyzed: '+String(frameResult.error.message).slice(0,180));
   track.timings={totalMs:visualTiming.snapshot().totalMs,stages:{...track.timings.stages,...visualTiming.snapshot().stages}};
   if(!visual&&!track.audio&&!track.audioObservation&&!track.waveform&&!track.transcription?.hasRecognizedSpeech)throw Error(track.warnings.join(' | '));
   return {type:'video',...track,visual,limitations:'Audio observations/transcripts can be incorrect, sampled frames describe only visible pixels, and waveform features identify no sound source. None confirms a mechanical fault.'};
  }
  const track=await analyzeAudioTrack(source,temp,language,options);
  if(!track.waveform&&!track.audioObservation&&!track.audio&&!track.transcription?.hasRecognizedSpeech)throw Error(track.warnings.join(' | '));
  return {type:'audio',...track,limitations:'Hosted audio observations and transcripts may be wrong. Waveform metrics identify no sound source. CLAP, if enabled locally, returns uncalibrated similarities. No mechanical fault is confirmed.'};
 }finally{await rm(temp,{recursive:true,force:true}).catch(()=>{});}
}
