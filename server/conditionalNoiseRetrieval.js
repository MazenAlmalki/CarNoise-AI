import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const cards=JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data/conditional_noise_patterns_v1.json'),'utf8'));
const normalize=v=>String(v||'').toLowerCase().replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const aliases={
 timing:{
  braking:/فرامل|افرمل|بريك|brak/i,turning:/دركسون|لف|انعطاف|turn|corner/i,bumps:/مطب|مطبّ|حفر|bumps?|pothole/i,
  startup:/تشغيل|سلف|start|crank/i,idle:/واقف|واقفه|وقوف|idle|idling/i,
  acceleration:/دعس|تسارع|rpm|accelerat/i,driving:/سرعه|مشي|مشيت|امشي|driv|road|speed/i
 },
 texture:{
  squeal:/صرير|صفير|صفر|squeal|screech|chirp/i,grind:/حك|طحن|احتكاك|grind|scrap/i,
  click:/طقطق|تكتك|طق|click|clunk|tick|knock/i,rattle:/خشخش|رجه|رجف|rattl|shak|vibrat/i,
  hum:/ونه|ونّ|طنين|حسيس|هسهس|همهم|hum|whin|roar|hiss/i
 },
 location:{
  engine:/مكين|محرك|كبوت|engine|hood/i,wheel:/كفر|عجل|اطار|تاير|wheel|tire|tyre/i,
  under:/تحت|شكمان|عادم|اسفل|under|exhaust/i,cabin:/داخل|طبلون|مكيف|cab|dashboard|interior/i
 }
};
function detect(text){
 const t=normalize(text);
 return Object.fromEntries(Object.entries(aliases).map(([kind,patterns])=>[
  kind,Object.keys(patterns).filter(key=>patterns[key].test(t))
 ]));
}
export function retrieveConditionalPatterns(description,{limit=3}={}){
 const query=detect(String(description||'').slice(0,1400));
 if(!Object.values(query).some(x=>x.length))return [];
 return cards.map(card=>{
  const hits=['timing','texture','location'].filter(k=>query[k].includes(card[k]));
  return {...card,matchCount:hits.length,matchedFeatures:hits};
 }).filter(x=>x.matchCount>=2).sort((a,b)=>b.matchCount-a.matchCount||
  ((a.urgency==='high'?1:0)-(b.urgency==='high'?1:0))*-1).slice(0,Math.min(limit,5));
}
export function conditionalPatternStats(){return {patterns:cards.length,uniqueSources:new Set(cards.map(x=>x.source_url)).size};}
