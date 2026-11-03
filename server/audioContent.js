import {verifiedKnownRecording} from './knownRecordings.js';
// Preliminary content observations, never a trained fault classifier.
export const AUDIO_CONTENT_TYPES=['speech','mechanical_sound','mixed','music','silence','other','uncertain'];
export function audioContent(media){
 if(verifiedKnownRecording(media?.localReferenceIdentity))return {type:'uncertain',status:'identity_matched',speechPresent:false,mechanicalEventObserved:false,source:media.localReferenceIdentity.source,verified:false,limitation:'The known file or audio recording was identified; its contents and fault label were not independently classified or verified.'};
 const speech=media?.transcription?.hasRecognizedSpeech===true&&typeof media.transcription.text==='string'&&Boolean(media.transcription.text.trim());
 const analysis=media?.audioEventAnalysis,observation=media?.audioObservation;
 const succeeded=analysis?.provider==='gemini'&&analysis.succeeded===true&&observation?.provider==='gemini';
 const type=succeeded&&AUDIO_CONTENT_TYPES.includes(observation.contentType)?observation.contentType:'uncertain';
 return {type,status:succeeded?'observed':analysis?.attempted&&!analysis.succeeded?'failed':'unavailable',speechPresent:Boolean(speech),
  mechanicalEventObserved:Boolean(succeeded&&['mechanical_sound','mixed'].includes(type)&&observation.hasMechanicalSound===true),
  source:succeeded?'hosted_audio_model':speech?'asr_only':'no_content_observation',verified:false,
  limitation:'ASR only detects recognized words; it cannot exclude other sounds. Mechanical sound does not establish a vehicle source or faulty component.'};
}
export function nonMechanicalMediaReply(media,language='ar',failure=null){
 const content=audioContent(media),en=language==='en';
 const text=content.status==='failed'||failure
  ? en?'The recording could not be analyzed. I cannot tell what it contains; retry or describe what you intended.':'تعذر تحليل التسجيل، فما أقدر أحدد محتواه. جرّب مرة ثانية أو اكتب المقصود.'
  :content.status==='unavailable'
  ? en?'Sound understanding is not configured. Waveform measurements cannot identify this recording; describe its contents or configure an audio provider.':'فهم محتوى الصوت غير مهيأ. قياس الموجة ما يحدد التسجيل؛ اكتب محتواه أو فعّل مزود تحليل الصوت.'
  :content.type==='music'
  ? en?'The audio model reports music. That is not evidence of a vehicle fault.':'المودل وصف موسيقى في التسجيل. هذا مو دليل على عطل سيارة.'
  :content.type==='silence'
  ? en?'The audio model reports silence or no clear audible event. Try a clearer recording.':'المودل ما رصد حدثًا مسموعًا واضحًا أو وصف صمتًا. جرّب تسجيلًا أوضح.'
  :content.type==='speech'
  ? en?'The recording appears to contain speech, but no reliable words were recognized. Please retry or type them.':'التسجيل يبدو كلامًا، لكن ما توفر تفريغ موثوق. أعد التسجيل أو اكتب الكلام.'
  :en?'I could not reliably identify the recording contents. I will not assume it is a car sound. Please describe what you intended.':'محتوى التسجيل مو واضح بشكل موثوق. ما راح أفترض إنه صوت سيارة؛ اكتب وش تقصد.';
 return {reply:text,audioContent:content,grounding:'audio-content-routing',knowledgeMatches:[],canSkipQuestion:false,problemSummary:null,
  audioStatus:content.status==='failed'||failure?'classifier-error':content.status==='unavailable'?'classifier-not-configured':'no-candidates',
  audioError:content.status==='failed'?String(failure||(Array.isArray(media?.warnings)?media.warnings.find(x=>typeof x==='string'&&/Gemini|CLAP/.test(x)):'')||'Audio analysis failed').slice(0,160):null};
}
