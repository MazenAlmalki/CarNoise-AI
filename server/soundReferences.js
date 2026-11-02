import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
const sources=JSON.parse(readFileSync(path.join(base,'youtube_car_sound_references_v1.json'),'utf8'));
const examples=readFileSync(path.join(base,'sound_description_examples_v1.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse);
const keywords=[
 ['brake_squeal',/(?:صرير.*فرامل|الفرامل.*تصر|brake.*squeal)/i],
 ['brake_grind',/(?:حك.*فرامل|طحن.*فرامل|brake.*grind)/i],
 ['belt_squeal',/(?:صفير.*سير|سير.*يصفر|belt.*squeal)/i],
 ['wheel_bearing_hum',/(?:ونه.*(?:كفر|عجل|سرعه)|طنين.*سرعه|wheel.*hum|bearing.*noise)/i],
 ['cv_joint_click',/(?:طقطق[هة].*(?:لف|دركسون)|طق.*عكس|cv.*click)/i],
 ['suspension_clunk',/(?:طق.*مطب|طقه.*مطب|suspension.*clunk)/i],
 ['exhaust_rattle',/(?:خشخش.*شكمان|شكمان.*صوت|exhaust.*rattl)/i],
 ['engine_ticking',/(?:تكتك.*مكين|طقطقه.*مكين|engine.*tick)/i],
 ['engine_knock',/(?:دق.*مكين|طرقات.*مكين|engine.*knock)/i]
];
export function retrieveSoundReading(message,{limit=2}={}){
 const text=String(message||'').slice(0,700);
 const wanted=keywords.filter(([,re])=>re.test(text)).map(([id])=>id);
 if(!wanted.length)return[];
 const selected=[];
 for(const id of wanted){
  const source=sources.find(x=>x.suggested_audio_category===id);
  if(source && !selected.some(x=>x.url===source.url))selected.push({
   subject:id,title:source.title,url:source.url,source_channel:source.channel,
   type:'publisher_labeled_educational_reference',audio_verified:false,
   note:'This linked video discusses a sound category. It is not evidence that the user recording contains it.'
  });
  if(selected.length>=limit)break;
 }
 return selected;
}
export function soundCorpusStats(){
 return {youtubeLinks:sources.length,syntheticExamples:examples.length,distinctAudioTopics:new Set(sources.map(x=>x.suggested_audio_category)).size};
}
