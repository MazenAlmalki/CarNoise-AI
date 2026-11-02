// Lists metadata only. Never print the API key, headers or provider error bodies.
import 'dotenv/config';
const key=process.env.GEMINI_API_KEY?.trim();
if(!key){console.error('Set GEMINI_API_KEY in your private .env first.');process.exitCode=1;}
else{
 try{
  let page='';
  do{
   const url=new URL('https://generativelanguage.googleapis.com/v1beta/models');
   if(page)url.searchParams.set('pageToken',page);
   const response=await fetch(url,{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw Object.assign(new Error('Models API returned HTTP '+response.status+'. Check project access, key and quota.'),{safeToDisplay:true});
   const body=await response.json();
   for(const model of body.models||[]){if(model.supportedGenerationMethods?.includes('generateContent'))console.log(model.name);}
   page=typeof body.nextPageToken==='string'?body.nextPageToken:'';
  }while(page);
  console.log('These models support generateContent. Confirm audio input support and current pricing for your chosen model in Google’s documentation.');
 }catch(error){console.error(error.safeToDisplay?error.message:error?.name==='TimeoutError'?'The Gemini models request timed out.':error instanceof TypeError?'Cannot reach the Gemini models API. Check your network/proxy.':'The Gemini models response could not be read.');process.exitCode=1;}
}
