import {verifiedKnownRecording} from './knownRecordings.js';
import {readFileSync} from 'node:fs';
import {loadAudioReferences} from './audioReferences.js';
import {hasHostedAudioEvidence} from './geminiAudio.js';
import {detectReplyLanguage} from './chatLanguage.js';
import {audioContent} from './audioContent.js';
const knowledge=JSON.parse(readFileSync(new URL('../data/typed_symptoms_v1.json',import.meta.url),'utf8'));
// Guidance concerns related symptoms/systems, not a repair inferred from audio.
const guidance={
 'upload1-01':'T016','upload1-02':'T001','upload1-03':'T027','upload1-04':'T014',
 'upload1-05':'T013','upload1-06':'T019','upload1-07':'T027','upload1-08':'T023',
 'upload2-01':'T027','upload2-02':'T027','upload2-03':'T013','upload2-04':'T022',
 'upload2-05':'T008','upload2-06':'T016','upload2-07':'T029'
};
const text=(value,max=240)=>typeof value==='string'?value.trim().slice(0,max):'';
const sourceFor=id=>knowledge.find(card=>card.id===id);
function noMatch(reason,language,safety=null){
 const ar=language==='ar';
 const reasons={
  failed:ar?'تعذر تحليل التسجيل، لذلك ما نقدر نقارنه بثقة.':'The recording could not be analyzed, so no reliable comparison is available.',
  nonmechanical:ar?'لم يُرصد حدث ميكانيكي واضح؛ الكلام أو الموسيقى ليسا دليلًا على عطل.':'No clear mechanical event was observed; speech or music is not evidence of a fault.',
  uncertain:ar?'التسجيل غير واضح أو لا يشبه مثالًا واحدًا بشكل مميز.':'The recording is unclear or does not distinctly resemble one reference.',
  ambiguous:ar?'تسمية المثال أو ارتباطها بالصوت يحتاج مراجعة؛ ما نقدر نسمي قطعة منه.':'The reference label or its association needs review, so it cannot identify a component.',
  conflict:ar?'الوصف أو ردك على المثال لا يؤيد هذا التطابق؛ ما نقدر نرجّح قطعة.':'Your description or reference feedback does not support this match, so no component can be suggested.',
  unavailable:ar?'المقارنة الصوتية غير متاحة لهذا التسجيل.':'Audio comparison is unavailable for this recording.'
 };
 const source=sourceFor('T040');
 return {version:1,status:'no_reliable_match',title:ar?'لا يوجد تطابق موثوق':'No reliable match',problem:null,
  why:reasons[reason]||reasons.uncertain,steps:[ar?'اكتب متى يظهر الصوت ومن أي جهة، وأرفق تسجيلًا أوضح إن أمكن.':'Describe when and where it occurs, and attach a clearer recording if possible.'],
  safety,reference:null,sources:[{url:source.source_url,label:ar?'إرشاد عام عن الأصوات':'General noise guidance'}],diagnosisConfirmed:false};
}
function contradictsContext(id,current,history){
 const statements=[...(Array.isArray(history)?history:[]).filter(x=>x?.role==='user').slice(-6).map(x=>text(x.content,700)),text(current,2200)].join(' ').toLowerCase();
 // Only explicit incompatible operating conditions block a name. Missing context
 // is never filled in from a selected vehicle, old case or reference label.
 if(id==='upload1-02'&&/not (?:when |while )?braking|without braking|مو (?:مع |وقت )?الفرامل|بدون فرامل/i.test(statements))return true;
 if(['upload1-06','upload1-08'].includes(id)&&/only (?:when |while )?(?:braking|over bumps)|فقط (?:مع |وقت )?الفرامل|بس على المطبات/i.test(statements))return true;
 return false;
}
export async function buildSoundResult({media,language='ar',current='',messages=[],conflicts=[],failure=null,safety=null,vehicle=null,history=[]}={}){
 const known=verifiedKnownRecording(media?.localReferenceIdentity);
 if(known){
  const ar=language==='ar',advice=sourceFor(guidance[known.reference_id]);
  let refs;try{refs=await loadAudioReferences();}catch{return noMatch('unavailable',language,safety);}
  if(!advice||!refs.some(r=>r.id===known.reference_id))return noMatch('unavailable',language,safety);
  return {version:1,status:'known_recording',title:ar?'المشكلة المحتملة':'Possible problem',problem:ar?known.label_ar:known.label_en,
   why:'',
   steps:[ar?advice.safe_next_step_ar:advice.safe_next_step_en,ar?'دوّن متى يظهر الصوت، واطلب تأكيد السبب بالفحص قبل تغيير أي قطعة.':'Note when the sound occurs and confirm the cause by inspection before replacing parts.'],
   safety,reference:{id:known.reference_id,url:'/api/audio-references/'+known.reference_id},sources:[{url:advice.source_url,label:/theaa\.com/.test(advice.source_url)?'The AA':/aaa\.com/.test(advice.source_url)?'AAA':/ftc\.gov/.test(advice.source_url)?'FTC':ar?'إرشاد للفحص':'Inspection guidance'}],
   labelNote:'',evidenceBasis:'registered_recording_identity',diagnosisConfirmed:false};
 }
 const content=audioContent(media);
 // Source recordings have unknown vehicle/operating conditions. Identity and
 // unverified history cannot establish model-specific compatibility or a fault.
 const contextIsContinuation=/same (?:sound|problem)|نفس (?:الصوت|المشكلة)/i.test(text(current,2200));
 const userHistory=contextIsContinuation?(Array.isArray(history)?history:[]).slice(-3).map(x=>({role:'user',content:text(x?.description,200)})):[];
 if(failure||content.status==='failed')return noMatch('failed',language,safety);
 if(!hasHostedAudioEvidence(media))return noMatch(content.status==='observed'?'nonmechanical':'unavailable',language,safety);
 if(Array.isArray(conflicts)&&conflicts.length)return noMatch('conflict',language,safety);
 const comparison=media.audioObservation.referenceComparison;
 if(comparison?.source!=='gemini_direct_audio_reference_comparison'||comparison.result!=='clear'||!Array.isArray(comparison.matches)||comparison.matches.length!==1||!text(comparison.reason))return noMatch('uncertain',language,safety);
 let references;try{references=await loadAudioReferences();}catch{return noMatch('unavailable',language,safety);}
 const reference=references.find(r=>r.id===comparison.matches[0]?.id);
 if(!reference)return noMatch('unavailable',language,safety);
 const review=reference.label_alignment_review;
 if(!text(review?.displayed_label_ar)||!review?.midpoint_and_end_label_visible||review.term_clarification_required)return noMatch('ambiguous',language,safety);
 const feedback=(Array.isArray(messages)?messages:[]).filter(m=>m?.role==='user').slice(-4).map(m=>text(m.content,700)).join(' ')+' '+text(current,2200);
 if(/my sound is different from the example|not sure whether my sound resembles|صوتي مختلف عن المثال|مو متأكد إن صوتي يشبه المثال/i.test(feedback)||contradictsContext(reference.id,[text(current,2200),text(media.transcription?.text,700)].join(' '),[...userHistory,...(Array.isArray(messages)?messages:[])]))return noMatch('conflict',language,safety);
 const advice=sourceFor(guidance[reference.id]);
 if(!advice)return noMatch('ambiguous',language,safety);
 const ar=language==='ar';
 const problem=ar?review.displayed_label_ar:reference.label_en;
 const reason=text(comparison.reason,240).split(/[.!؟\n]/u)[0].trim();
 const usableReason=reason.length>=8&&detectReplyLanguage(reason,language)===language&&!/https?:|[0-9٠-٩%٪]|confidence|probability|ثقة|gemini|openrouter|api|json|replace|repair|confirmed|diagnos|تغيير|إصلاح|اصلاح|مؤكد|\{|\}/i.test(reason);
 const why=usableReason?(ar?'تشابه محتمل وغير مؤكد: ':'Tentative resemblance: ')+reason+'.'
  :ar?'المقارنة الصوتية رصدت تشابهًا محتملًا مع المثال؛ التشابه لا يثبت أن القطعة هي السبب.':'Audio comparison reports a possible resemblance to the reference; this does not establish the component as the cause.';
 const nextStep=['upload1-05','upload2-03'].includes(reference.id)
  ? ar?'اطلب من فني فحص نظام التبريد؛ لا تغيّر مضخة أو مروحة اعتمادًا على الصوت وحده.':'Ask a technician to inspect the cooling system; do not replace a pump or fan based on sound alone.'
  :ar?advice.safe_next_step_ar:advice.safe_next_step_en;
 return {version:1,status:'possible_match',title:ar?'مشكلة محتملة — تطابق غير مؤكد':'Possible problem — tentative match',problem,
  why,
  steps:[ar?'دوّن متى يظهر الصوت وظروفه، واحتفظ بالتسجيل للفني.':'Note when it occurs and keep the recording for the technician.',nextStep],
  safety,reference:{id:reference.id,url:'/api/audio-references/'+reference.id},
  sources:[{url:advice.source_url,label:ar?'إرشاد للفحص':'Inspection guidance'}],
  labelNote:ar?'الاسم من عنوان المقطع الأصلي، وليس تشخيصًا مؤكدًا.'+(vehicle?.modelId?' المثال لا يثبت عطلًا خاصًا بموديل سيارتك.':''):'The name comes from the original video label, not a confirmed diagnosis.'+(vehicle?.modelId?' It does not establish a model-specific fault.':''),diagnosisConfirmed:false};
}
export function soundResultText(card,language='ar'){
 const ar=language==='ar';
 return [card.title,card.problem,card.why,(ar?'الخطوات المقترحة:':'Suggested steps:')+'\n'+card.steps.map(s=>'• '+s).join('\n'),card.safety,card.labelNote].filter(Boolean).join('\n\n');
}
