import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
const sources=JSON.parse(readFileSync(path.join(base,'youtube_car_sound_references_v1.json'),'utf8'));
const topics=JSON.parse(readFileSync(path.join(base,'sound_topics_bilingual_v1.json'),'utf8'));
const examples=readFileSync(path.join(base,'sound_description_examples_v1.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse);
const normalize=text=>String(text||'').toLowerCase().normalize('NFKC').replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// The extra phrase rules preserve non-contiguous descriptions used in Saudi speech.
const contextual=[
 ['brake_squeal',/(?:صرير.*فرامل|الفرامل.*(?:تصر|تصفر)|brake.*squeal)/i],
 ['brake_grind',/(?:حك.*فرامل|طحن.*فرامل|brake.*grind)/i],
 ['belt_squeal',/(?:صفير.*سير|سير.*يصفر|belt.*squeal)/i],
 ['wheel_bearing_hum',/(?:ونه.*(?:كفر|عجل|سرعه)|طنين.*سرعه|wheel.*hum|bearing.*noise)/i],
 ['cv_joint_click',/(?:طقطق[هة].*(?:لف|دركسون)|طق.*عكس|cv.*click)/i],
 ['suspension_clunk',/(?:طق.*مطب|طقه.*مطب|suspension.*clunk)/i],
 ['exhaust_rattle',/(?:خشخش.*شكمان|شكمان.*صوت|exhaust.*rattl)/i],
 ['engine_ticking',/(?:تكتك.*مكين|طقطقه.*مكين|engine.*tick)/i],
 ['engine_knock',/(?:دق.*مكين|طرقات.*مكين|engine.*knock)/i]
];
export function retrieveSoundReading(message,{limit=2,language='en'}={}){
 const text=normalize(String(message||'').slice(0,1200));
 const wanted=topics.filter(topic=>[...topic.search_terms.ar,...topic.search_terms.en].some(alias=>text.includes(normalize(alias)))||contextual.some(([id,re])=>id===topic.id&&re.test(text)));
 const selected=[];const lang=language==='ar'?'ar':'en';
 for(const topic of wanted){
  const source=sources.find(x=>x.suggested_audio_category===topic.id);
  if(source&&!selected.some(x=>x.url===source.url))selected.push({
   subject:topic.id,title:topic.label[lang],original_title:source.title,url:source.url,source_channel:source.channel,
   summary:lang==='ar'?source.summary_ar:source.summary_en,
   title_ar:topic.label.ar,title_en:topic.label.en,summary_ar:source.summary_ar,summary_en:source.summary_en,
   type:'publisher_labeled_educational_reference',audio_verified:false,
   note:lang==='ar'?'مرجع وصفي سابق، لم يُستمع إلى صوته هنا. لا يثبت أن تسجيل المستخدم يحتوي الصوت أو العطل نفسه.':'Existing publisher metadata; audio was not reviewed here. This is not a match or diagnosis for the user recording.'
  });
  if(selected.length>=Math.max(1,Math.min(5,limit)))break;
 }
 return selected;
}
export function soundCorpusStats(){
 return {youtubeLinks:sources.length,syntheticExamples:examples.length,distinctAudioTopics:new Set(sources.map(x=>x.suggested_audio_category)).size};
}
