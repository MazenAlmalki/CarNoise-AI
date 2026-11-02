// Warshatak Context Engine V1
// Evidence in the context comes ONLY from explicit user-authored statements.
// Model guesses, retrieved source cards, and previous speculative responses
// must never silently become confirmed symptoms.
import {buildChatHistory} from './conversationContext.js';

const followUp=/^(?:زي|مثل|ايوه|ايه|اي|نعم|لا|بس|لكن|و|عند|اذا|لما|تزيد|تخف|قصدت|اقصد|مو|مب|صحيح|صح|yes|no|it|like|only|when|also|and|same|exactly)\b/i;
const correction=/(?:مو كذا|مب كذا|ما اقصد|اقصد|قصدي|قلت لك|لا[،, ]+|i meant|not what i meant|actually|correction|you misunderstood)/i;
const followOnShort=/^(?:بعد|الحين|تونا|برضه|وبرضه|بعدها|كمان|مع|بدون|يزيد|تخف)/i;
const greeting=/^(?:هلا|السلام عليكم|مرحبا|اهلين|سلام|hi|hello|hey|good morning|thanks|شكرا)[\s!؟?.]*$/i;
const tokenize=text=>String(text||'').toLowerCase().replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^a-z0-9\u0621-\u064a]+/g,' ').split(' ').filter(x=>x.length>2);
function cleanText(x,max=380){return String(x||'').trim().replace(/\s+/g,' ').slice(0,max);}
function userTurns(entries){
 return Array.isArray(entries)?entries.filter(x=>x?.role==='user'&&typeof x.content==='string')
  .map(x=>cleanText(x.content)).filter(Boolean):[];
}
function relevantUtterances(turns,current,{limit=7}={}){
 const now=cleanText(current,500);
 const normalized=new Set(tokenize(now));
 const recent=turns.slice(-12);
 if(!recent.length)return[];
 const isFollowup=followUp.test(now)||followOnShort.test(now)||normalized.size<=2;
 // If the user starts a clearly new topic, avoid carrying old mechanic context.
 const lastPart=isFollowup?recent:recent.slice(-4);
 const candidates=lastPart.map((text,index)=>{
  const overlap=tokenize(text).filter(token=>normalized.has(token)).length;
  return {text,priority:overlap*3+(isFollowup?2:0)+index/100};
 }).filter(x=>!greeting.test(x.text));
 const picked=candidates.sort((a,b)=>b.priority-a.priority).slice(0,limit)
  .sort((a,b)=>lastPart.indexOf(a.text)-lastPart.indexOf(b.text));
 const original=recent.find(text=>!greeting.test(text));
 if(isFollowup&&original&&!picked.some(x=>x.text===original)){
  if(picked.length>=limit)picked.shift();
  picked.unshift({text:original});
 }
 return picked.map(x=>x.text);
}
export function buildContextEngine({messages=[],current='',vehicleHistory=[],mediaInsight=null}={}){
 const all=userTurns(messages);
 const selected=relevantUtterances(all,current);
 const recent=buildChatHistory(messages,{recent:10});
 const currentText=cleanText(current,600);
 const corrected=correction.test(currentText);
 const observedMedia=mediaInsight&&typeof mediaInsight==='object'?
  {
   type:['audio','video','image'].includes(mediaInsight.type)?mediaInsight.type:null,
   speechRecognized:mediaInsight.transcription?.hasRecognizedSpeech===true,
   soundClassifierRan:mediaInsight.audioEventAnalysis?.attempted===true,
   soundClassifierSucceeded:mediaInsight.audioEventAnalysis?.succeeded===true,
   visualObserved:Boolean(mediaInsight.visual?.description),
   hostedAudioObserved:mediaInsight.audioEventAnalysis?.provider==='gemini'&&mediaInsight.audioEventAnalysis?.succeeded===true,
   audioObservationSource:mediaInsight.audioObservation?.provider==='gemini'?'gemini_model_generated_not_diagnosis':null,
   limitation:'Waveform only is NOT a recognized car sound. CLAP candidates are uncalibrated similarities. Gemini descriptions/transcripts may be wrong. Image observations cannot establish a mechanical fault.'
  }:null;
 const existingVehicles=Array.isArray(vehicleHistory)?vehicleHistory.slice(0,3).map(x=>({
  date:cleanText(x?.date,16),userDescription:cleanText(x?.description,180),
  suspectedSummary:cleanText(x?.suspectedSummary,100),diagnosisConfirmed:false
 })):[];
 return {
  originalComplaint:selected[0]||currentText,
  userReportedDetails:[...selected,currentText].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(-8),
  latestUserCorrection:corrected?currentText:null,
  earlierConversation:recent,
  priorCaseHistory:existingVehicles,
  mediaEvidence:observedMedia,
  retrievalQuery:[currentText,...selected.slice(-3)].filter(Boolean).join(' ؛ ').slice(0,1200),
  instructions:[
   'Use only user-authored descriptions as user facts; do not promote prior assistant guesses to confirmed diagnoses.',
   'Preserve details already supplied and avoid repeating answered questions.',
   corrected?'The current user message corrects earlier descriptions; prefer this correction over contradictory older wording.':'The latest message may be additional context, not a new isolated fault.',
   'Distinguish confirmed observations from possible causes, and ask one focused question if evidence is insufficient.'
  ]
 };
}
