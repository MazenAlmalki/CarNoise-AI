import 'dotenv/config';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

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
function fileExtension(type){
 const supported={
  'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp',
  'audio/wav':'.wav','audio/x-wav':'.wav','audio/mpeg':'.mp3','audio/mp4':'.m4a','audio/x-m4a':'.m4a','audio/aac':'.aac','audio/ogg':'.ogg','audio/webm':'.webm',
  'video/mp4':'.mp4','video/webm':'.webm','video/quicktime':'.mov'
 };
 return supported[type]||null;
}
function parseOllamaURL(){
 const raw=process.env.OLLAMA_HOST?.trim()||'http://127.0.0.1:11434';
 const url=new URL(raw);
 if(!['127.0.0.1','localhost','::1'].includes(url.hostname)||url.protocol!=='http:')throw Error('OLLAMA_HOST must be local.');
 return url.origin;
}
async function visualDescription(images,language){
 const host=parseOllamaURL();
 const model=process.env.VISION_MODEL?.trim()||'qwen3-vl:2b';
 const instruction=language==='en'?'Describe only directly visible vehicle parts, lights and events in these still frames, briefly. Do not guess a mechanical fault or pretend you heard any audio.':'صف الأجزاء والعلامات والأحداث المرئية فقط في هذه الصور بإيجاز. لا تفترض عطلًا ميكانيكيًا ولا تدّع سماع الصوت.';
 const response=await fetch(host+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({model,stream:false,messages:[{role:'user',content:instruction,images}],options:{num_predict:200}}),
  signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw new Error('Vision model unavailable. Install it with ollama pull '+model);
 const data=await response.json();
 const content=String(data.message?.content||'').trim().slice(0,1200);
 if(!content)throw new Error('Vision model returned no observations.');
 return {model,description:content};
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
async function audioSimilarity(input){
 const python=process.env.AUDIO_PYTHON?.trim()||(process.platform==='win32'?'python':'python3');
 const script=path.resolve('scripts','analyze_car_audio.py');
 const output=await runProcess(python,[script,input],{timeout:180000,limit:15000});
 const result=JSON.parse(output.trim());
 if(!Array.isArray(result.matches))throw new Error('Audio model response malformed.');
 return result;
}
export async function analyzeUploadedMedia(file,language='ar'){
 const extension=fileExtension(file.mimetype);
 if(!extension)throw new Error(language==='en'?'Unsupported media type.':'نوع الملف غير مدعوم.');
 if(!file.buffer?.length||file.size>25*1024*1024)throw new Error(language==='en'?'File must be below 25 MB.':'الملف يجب أن يكون أقل من 25 ميجابايت.');
 const temp=await mkdtemp(path.join(os.tmpdir(),'warshatak-'));
 const source=path.join(temp,'upload'+extension);
 try{
  await writeFile(source,file.buffer);
  if(file.mimetype.startsWith('image/')){
   const observed=await visualDescription([file.buffer.toString('base64')],language);
   return {type:'image',visual:observed,summary:observed.description,limitations:'Image is a visual observation, NOT a mechanical diagnosis.'};
  }
  if(file.mimetype.startsWith('video/')){
   const warnings=[];
   let visual=null,audio=null;
   try{visual=await visualDescription(await videoFrames(source,temp),language);}
   catch(e){warnings.push('Video frames could not be analyzed: '+String(e.message).slice(0,180));}
   // Audio model is optional because it requires a separate environment and substantial RAM.
   if(process.env.ENABLE_AUDIO_CLAP==='1'){
    try{audio=await audioSimilarity(source);}catch(e){warnings.push('Audio: '+String(e.message).slice(0,180));}
   }else warnings.push('Video audio not analyzed. Enable the optional CLAP model to process it.');
   if(!visual&&!audio)throw Error(warnings.join(' | '));
   return {type:'video',visual,audio,warnings,limitations:'Only sampled frames and optional coarse audio similarity; does not establish a confirmed mechanical fault.'};
  }
  if(process.env.ENABLE_AUDIO_CLAP!=='1')throw Error(language==='en'?'Audio analysis is not configured. Follow MULTIMODAL_SETUP.md to enable CLAP.':'تحليل الصوت غير مفعّل. اتبع خطوات MULTIMODAL_SETUP.md لتفعيل CLAP.');
  const audio=await audioSimilarity(source);
  return {type:'audio',audio,limitations:'CLAP text-audio similarities are exploratory and NOT repair probabilities or verified diagnoses.'};
 }finally{await rm(temp,{recursive:true,force:true}).catch(()=>{});}
}
