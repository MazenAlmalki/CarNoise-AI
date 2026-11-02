import {spawn} from 'node:child_process';

export async function ffmpegAvailable(){
 const binary=process.env.FFMPEG_PATH?.trim()||'ffmpeg';
 return await new Promise(resolve=>{
  let done=false;
  const child=spawn(binary,['-version'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  const end=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
  const timer=setTimeout(()=>{child.kill('SIGKILL');end(false);},3500);
  child.on('error',()=>end(false));
  child.on('close',code=>end(code===0));
 });
}
