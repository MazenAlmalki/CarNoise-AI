// ASR only. This module never imports sound recognition, references or chat.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validateMedia} from '../public/media-formats.js';
import {speechFallbackConfiguration,transcribeWithGroq} from './speechFallback.js';
export const MAX_DICTATION_BYTES=5*1024*1024;
export const MAX_DICTATION_SECONDS=60;
export function dictationConfiguration(env=process.env){
 try {return {...speechFallbackConfiguration(env),maxBytes:MAX_DICTATION_BYTES,maxSeconds:MAX_DICTATION_SECONDS};}
 catch {return {provider:'invalid',configured:false,maxBytes:MAX_DICTATION_BYTES,maxSeconds:MAX_DICTATION_SECONDS};}
}
function run(command,args,{signal,limit=2_000_000,environment=process.env}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(new DOMException('Cancelled','AbortError'));
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],windowsHide:true,env:environment});
  const chunks=[];let length=0,failure=null;
  const stop=()=>{failure=new DOMException('Cancelled','AbortError');child.kill('SIGKILL');};
  const timer=setTimeout(()=>{failure=Error('Dictation processing timed out');child.kill('SIGKILL');},90000);
  signal?.addEventListener('abort',stop,{once:true});
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);};
  child.stdout.on('data',chunk=>{length+=chunk.length;if(length>limit){failure=Error('Dictation output too large');child.kill('SIGKILL');}else chunks.push(chunk);});
  child.stderr.resume();
  child.on('error',()=>{cleanup();reject(Error('Dictation dependency unavailable'));});
  child.on('close',code=>{cleanup();failure?reject(failure):code!==0?reject(Error('Could not decode or transcribe recording')):resolve(Buffer.concat(chunks));});
 });
}
function wav(pcm){
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(16000,24);header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);return Buffer.concat([header,pcm]);
}
export async function transcribeDictation(file,{env=process.env,fetchImpl=fetch,signal}={}){
 const config=dictationConfiguration(env);
 if(!config.configured)throw Object.assign(Error('Dictation ASR is not configured. Set SPEECH_FALLBACK and its provider credentials/dependencies.'),{status:503});
 const valid=validateMedia({mimetype:file?.mimetype,size:file?.buffer?.length});
 if(!valid.ok||!valid.mime.startsWith('audio/'))throw Object.assign(Error('Supported audio recording required'),{status:400});
 if(file.buffer.length>MAX_DICTATION_BYTES)throw Object.assign(Error('Dictation recording exceeds 5 MiB'),{status:413});
 const temp=await mkdtemp(path.join(tmpdir(),'warshatak-dictation-'));
 try{
  const source=path.join(temp,'input'+valid.extension);await writeFile(source,file.buffer);
  const pcm=await run(env.FFMPEG_PATH||'ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-vn','-t','61','-ac','1','-ar','16000','-f','s16le','pipe:1'],{signal});
  if(!pcm.length)throw Error('No decodable audio');
  if(pcm.length/32000>MAX_DICTATION_SECONDS)throw Object.assign(Error('Dictation recording exceeds 60 seconds'),{status:413});
  let result;
  if(config.provider==='groq')result=await transcribeWithGroq(wav(pcm),{env,fetchImpl,signal});
  else {
   const normalized=path.join(temp,'speech.wav');await writeFile(normalized,wav(pcm));
   result=JSON.parse((await run(env.AUDIO_PYTHON||(process.platform==='win32'?'python':'python3'),[path.resolve('scripts/transcribe_audio.py'),normalized,config.language],{signal,limit:16000,environment:{...process.env,...env}})).toString());
  }
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  const text=result?.hasRecognizedSpeech===true&&typeof result.text==='string'?result.text.trim().slice(0,1000):'';
  return {text,hasRecognizedSpeech:Boolean(text),language:typeof result.language==='string'?result.language.slice(0,30):'unknown',provider:config.provider,source:'automatic_dictation_may_contain_errors',requiresUserReview:true};
 }finally{await rm(temp,{recursive:true,force:true});}
}
