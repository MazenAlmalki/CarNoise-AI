import {spawn} from 'node:child_process';

// Lightweight waveform characterization using ffmpeg decoded mono samples.
// No car-fault labels are inferred. Audio clips do not have to be uploaded
// to a third-party service; ffmpeg runs on the user's own backend.
async function decodePcm(filePath,{ffmpeg='ffmpeg',seconds=12}={}){
 return await new Promise((resolve,reject)=>{
  const args=['-hide_banner','-loglevel','error','-i',filePath,'-vn','-t',String(seconds),'-ac','1','-ar','8000','-f','s16le','pipe:1'];
  const child=spawn(ffmpeg,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});
  const chunks=[];let bytes=0,err='',done=false;
  const finish=(error,buffer)=>{
   if(done)return;done=true;clearTimeout(timer);
   error?reject(error):resolve(buffer);
  };
  const timer=setTimeout(()=>{child.kill('SIGKILL');finish(new Error('Audio decoding timed out. Make sure FFmpeg is installed.'));},35000);
  child.stdout.on('data',chunk=>{
   bytes+=chunk.length;
   if(bytes>200000){child.kill('SIGKILL');finish(new Error('Decoded audio limit exceeded.'));return;}
   chunks.push(chunk);
  });
  child.stderr.on('data',chunk=>{err=(err+String(chunk)).slice(-600);});
  child.on('error',e=>finish(new Error(e.code==='ENOENT'?'FFmpeg not found. Install FFmpeg and add it to PATH.':e.message)));
  child.on('close',code=>{
   if(done)return;
   if(code!==0)return finish(new Error(err||'Cannot decode audio. Check file format.'));
   finish(null,Buffer.concat(chunks));
  });
 });
}
export function describePcm(pcm,sampleRate=8000){
 if(!Buffer.isBuffer(pcm)||pcm.length<sampleRate*2/2)return {ok:false,reason:'Recording is too short.'};
 const len=Math.floor(pcm.length/2);
 if(len<sampleRate/4)return {ok:false,reason:'Recording is too short.'};
 const frameSize=800,frames=[];
 let peak=0,sum=0,zc=0,prev=0;
 for(let i=0;i<len;i++){
  const value=pcm.readInt16LE(i*2)/32768;
  const abs=Math.abs(value);peak=Math.max(peak,abs);sum+=value*value;
  if(i>0&&((value>=0)!==(prev>=0)))zc++;
  prev=value;
 }
 for(let i=0;i+frameSize<=len;i+=frameSize){
  let power=0;
  for(let j=i;j<i+frameSize;j++){const v=pcm.readInt16LE(j*2)/32768;power+=v*v;}
  frames.push(Math.sqrt(power/frameSize));
 }
 const rms=Math.sqrt(sum/len);
 const mean=frames.reduce((a,b)=>a+b,0)/(frames.length||1);
 const variation=frames.length?Math.sqrt(frames.reduce((a,b)=>a+(b-mean)**2,0)/frames.length)/(mean+1e-6):0;
 const active=frames.filter(x=>x>Math.max(0.012,mean*0.45)).length;
 const clipRatio=frames.length?active/frames.length:0;
 const crossingRate=zc/len;
 const level=rms<0.006?'very_quiet':rms<0.035?'quiet':rms<0.15?'moderate':'loud';
 const texture=crossingRate>0.25?'higher_frequency_content':crossingRate<0.04?'lower_frequency_content':'mixed_frequency_content';
 const temporal=variation>1?'intermittent_or_pulsing':'relatively_steady';
 const noiseLevel=peak>0.995?'possible_clipping':'not_obviously_clipped';
 return {ok:true,kind:'waveform_features_only',duration_seconds:Math.round(len/sampleRate*10)/10,
  level,temporal,frequency_texture: texture,possible_clipping:noiseLevel,
  detected_activity_ratio:Math.round(clipRatio*100)/100,
  limitations:'Basic signal features: NOT speech transcription, sound event recognition or car fault identification. Cannot determine which vehicle part produced a noise. Ask the user for timing and sound description.'};
}
export async function analyzeWaveform(filePath,{ffmpeg=process.env.FFMPEG_PATH}={}){
 const pcm=await decodePcm(filePath,{ffmpeg:ffmpeg?.trim()||'ffmpeg'});
 const result=describePcm(pcm);
 if(!result.ok)throw Error(result.reason);
 return result;
}
