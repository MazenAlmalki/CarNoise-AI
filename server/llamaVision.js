// Hosted Llama 4 Scout processes still images and sampled video frames.
// Uses the same server-side OpenRouter key as Llama text chat; no Qwen/Ollama.
import {chatProvider} from './chatProvider.js';
export const DEFAULT_VISION_MODEL='meta-llama/llama-4-scout';
export function visionConfiguration(env=process.env){
 const api=chatProvider(env);
 const model=(env.VISION_MODEL||DEFAULT_VISION_MODEL).trim();
 if(!model)throw new Error('Vision model is not configured');
 return {...api,model};
}
export async function describeVehicleImages(images,language='ar',{env=process.env,fetchImpl=fetch}={}){
 if(!Array.isArray(images)||images.length===0||images.length>2)throw Error('Expected one image or two sampled video frames');
 const api=visionConfiguration(env);
 const items=images.map(image=>{
  if(!image||typeof image.base64!=='string'||!/^image\/(?:jpeg|png|webp)$/.test(image.mimeType||''))throw Error('Unsupported image for vision API');
  const bytes=Math.floor(image.base64.length*3/4);
  if(bytes>6*1024*1024)throw Error('Image is too large for the hosted vision API (6MB max per image)');
  return {type:'image_url',image_url:{url:'data:'+image.mimeType+';base64,'+image.base64}};
 });
 const instruction=language==='en'
  ?'Describe only clearly visible vehicle parts, indicators and events in these image frames. Never claim you heard audio or diagnosed a mechanical fault. If nothing relevant is visible, say so concisely.'
  :'صف فقط ما يظهر بوضوح من أجزاء السيارة واللمبات والأحداث في الصورة. لا تدّع سماع الصوت أو تشخيص عطل، وإذا ما فيه دليل بصري واضح قل ذلك باختصار.';
 const response=await fetchImpl(api.endpoint,{method:'POST',
  headers:{'Content-Type':'application/json',...(api.key?{Authorization:'Bearer '+api.key}:{})},
  body:JSON.stringify({model:api.model,max_tokens:270,temperature:0.2,stream:false,
   messages:[{role:'user',content:[{type:'text',text:instruction},...items]}]}),
  signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error('Llama vision API unavailable (HTTP '+response.status+'). Check CHAT_API_KEY, provider credits and VISION_MODEL.');
 const body=await response.json();
 const content=body?.choices?.[0]?.message?.content;
 const description=typeof content==='string'?content.trim().slice(0,1200):'';
 if(!description)throw Error('Llama vision API returned an empty observation');
 return {model:api.model,description,source:'hosted_vision_images_only',limitations:'Only visible pixels in uploaded image(s) were assessed. No audio was heard and no fault was confirmed.'};
}
