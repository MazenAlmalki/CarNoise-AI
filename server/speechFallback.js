// Speech-to-text is independent of sound recognition. No fault labels are inferred.
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
function groqKey(env){
 if(env.GROQ_API_KEY?.trim())return env.GROQ_API_KEY.trim();
 // Never forward another provider's chat key to Groq.
 try{const url=new URL(env.CHAT_API_URL||'');if(url.protocol==='https:'&&url.hostname==='api.groq.com')return env.CHAT_API_KEY?.trim()||'';}catch{}
 return '';
}
export function speechFallbackConfiguration(env=process.env){
 const selection=(env.SPEECH_FALLBACK||'auto').trim().toLowerCase();
 if(!['auto','groq','local','none'].includes(selection))throw Error('SPEECH_FALLBACK must be auto, groq, local or none.');
 const language=(env.SPEECH_LANGUAGE||'auto').trim().toLowerCase();
 if(!['auto','ar','en'].includes(language))throw Error('SPEECH_LANGUAGE must be auto, ar or en.');
 const provider=selection==='auto'?(groqKey(env)?'groq':env.ENABLE_SPEECH_TRANSCRIPTION==='1'?'local':'none'):selection;
 const model=provider==='groq'?(env.GROQ_SPEECH_MODEL||'whisper-large-v3-turbo').trim():provider==='local'?(env.WHISPER_MODEL||'base').trim():null;
 if(model&&!/^[a-zA-Z0-9._/-]{1,100}$/.test(model))throw Error('Invalid speech model.');
 return {provider,model,language,configured:provider==='groq'?Boolean(groqKey(env)):provider==='local'&&env.ENABLE_SPEECH_TRANSCRIPTION==='1',
  sendsAudioToProvider:provider==='groq',reason:provider==='none'?'No fallback selected or configured.':undefined};
}
export function publicSpeechFallback(env=process.env){
 try{return speechFallbackConfiguration(env);}catch{return {provider:'invalid',configured:false,reason:'Check SPEECH_FALLBACK and SPEECH_LANGUAGE.'};}
}
export function acceptedSpeechSegments(segments){
 if(!Array.isArray(segments))return '';
 return segments.filter(segment=>typeof segment?.text==='string'&&typeof segment.no_speech_prob==='number'&&Number.isFinite(segment.no_speech_prob)&&
  typeof segment.avg_logprob==='number'&&Number.isFinite(segment.avg_logprob)&&segment.no_speech_prob<=0.6&&segment.avg_logprob>=-1.05)
  .map(segment=>clean(segment.text,1000)).filter(Boolean).join(' ').slice(0,1000).trim();
}
export async function transcribeWithGroq(wav,{env=process.env,fetchImpl=fetch}={}){
 const key=groqKey(env);
 if(!key)throw Error('Speech transcription: configure GROQ_API_KEY, or use your existing Groq CHAT_API_URL and CHAT_API_KEY.');
 const config=speechFallbackConfiguration({...env,SPEECH_FALLBACK:'groq'});
 if(!Buffer.isBuffer(wav)||wav.length<44||wav.length>2*1024*1024||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE')throw Error('Speech transcription needs a normalized WAV excerpt under 2 MB.');
 const form=new FormData();
 form.append('file',new Blob([wav],{type:'audio/wav'}),'speech-excerpt.wav');form.append('model',config.model);
 form.append('response_format','verbose_json');form.append('timestamp_granularities[]','segment');form.append('temperature','0');
 if(config.language!=='auto')form.append('language',config.language);
 let response;
 try{response=await fetchImpl('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:AbortSignal.timeout(45000)});}
 catch(error){throw Error(['TimeoutError','AbortError'].includes(error?.name)?'Speech transcription timed out.':'Speech transcription could not reach Groq. Check network/proxy access.');}
 if(!response.ok){
  const detail=[401,403].includes(response.status)?'key or access denied':response.status===429?'quota/rate limit reached':response.status===404?'speech model unavailable':'provider unavailable';
  throw Error(`Speech transcription failed (HTTP ${response.status}): ${detail}.`);
 }
 let body;try{body=await response.json();}catch{throw Error('Speech transcription returned an unreadable response.');}
 const text=acceptedSpeechSegments(body?.segments);
 return {type:'speech_transcription',model:config.model,source:'groq_whisper_transcript_may_contain_errors',language:clean(body?.language,30)||'unknown',
  text,hasRecognizedSpeech:Boolean(text),limitations:'Original-language automated transcript, not a translation or a car fault diagnosis. Verify important words; uncertain/no-speech segments are omitted.'};
}
