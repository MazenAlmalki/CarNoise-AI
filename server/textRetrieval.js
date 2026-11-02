import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/typed_symptoms_v1.json');
const cards = JSON.parse(readFileSync(filePath, 'utf8'));
const slangFile=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/saudi_dialect_aliases_v1.json');
const slang=new Map(JSON.parse(readFileSync(slangFile,'utf8')).map(x=>[x.knowledge_id,x.aliases]));
const stop = new Set([
  'السيارة','سيارتي','سياره','عندي','عند','في','من','على','مع','اذا','لما','كل','شوي','مرة',
  'صوت','فيه','صار','صارت','طلع','تطلع','يطلع','تجي','جاي','ابي','وش','ايش','مشكلة','المشكلة',
  'my','car','is','the','a','an','when','while','and','it','on','with','i','have','there','noise','sound'
]);
function normalized(text) {
  return String(text ?? '').toLowerCase()
    .replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^a-z0-9\u0621-\u064A]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function tokens(text) {
  return normalized(text).split(' ').filter(w => w.length > 2 && !stop.has(w));
}
function hasPhrase(input, phrase) {
  const p = normalized(phrase);
  return p.length >= 5 && (' ' + input + ' ').includes(' ' + p + ' ');
}
const prepared = cards.map(card => {
  const names=[card.symptom_ar,card.symptom_en,...card.aliases,...(slang.get(card.id)||[])];
  return {...card, _names:names.map(normalized), _tokens:[...new Set(names.flatMap(tokens))]};
});
export function retrieveTypedSymptoms(description, opts={}) {
  const count = Math.min(Math.max(Number(opts.limit) || 3, 1), 5);
  const normalizedInput=normalized(String(description).slice(0,600));
  const words=[...new Set(tokens(description))];
  if (words.length === 0) return [];
  const results=prepared.map(card => {
    const shared=words.filter(w => card._tokens.includes(w));
    let score=shared.length;
    const bestPhrase=card._names.filter(p => hasPhrase(normalizedInput,p)).sort((a,b)=>b.length-a.length)[0];
    if(bestPhrase) score += 4 + Math.min(bestPhrase.split(' ').length,4);
    // Don't match a record on generic noise words alone.
    return {card,score,matchedWords:shared.length};
  }).filter(x => x.score >= 2 || (x.score >= 1 && x.matchedWords && words.length === 1 && x.card._names.some(n=>n===normalizedInput)));
  results.sort((a,b)=>b.score-a.score || b.matchedWords-a.matchedWords || a.card.id.localeCompare(b.card.id));
  return results.slice(0,count).map(({card,score})=>({
    id:card.id,
    symptom_ar:card.symptom_ar,
    symptom_en:card.symptom_en,
    possible_causes_ar:card.possible_causes_ar,
    possible_causes_en:card.possible_causes_en,
    safe_next_step_ar:card.safe_next_step_ar,
    safe_next_step_en:card.safe_next_step_en,
    urgency_hint:card.urgency_hint,
    source_url:card.source_url,
    verification_status:card.verification_status,
    score
  }));
}
export function knowledgeCount(){return cards.length;}
