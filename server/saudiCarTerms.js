import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const terms=JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data/saudi_car_terms_v1.json'),'utf8'));
const clean=s=>String(s||'').toLowerCase().replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^a-z0-9\u0621-\u064a]+/g,' ').replace(/\s+/g,' ').trim();
const prepared=terms.map(t=>({
 term:t,
 forms:[t.term,...t.aliases,t.english].map(clean).filter(v=>v.length>=3)
}));
const contains=(value,phrase)=>(' '+value+' ').includes(' '+phrase+' ');
export function findSaudiCarTerms(message,{limit=4}={}){
 const input=clean(message).slice(0,700);
 if(!input)return[];
 const candidates=prepared.map(({term,forms})=>{
  const hit=forms.filter(form=>contains(input,form));
  if(!hit.length)return null;
  return {term,score:Math.max(...hit.map(x=>x.length))+(hit.some(x=>x===clean(term.term))?3:0)};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 // A very long generic word can beat a specific term. Prefer longer phrases
 // and let the model ask about ambiguous single words.
 return candidates.slice(0,Math.max(1,Math.min(6,limit))).map(({term})=>({
  term:term.term,meaning_ar:term.meaning_ar,meaning_en:term.english,
  explanation:term.explanation,clarifying_question_ar:term.clarifying_question_ar,
  ambiguous:term.category==='ambiguous'
 }));
}
export function carTermStats(){return {entries:terms.length,variants:terms.reduce((sum,t)=>sum+t.aliases.length,0)};}
