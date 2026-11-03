import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../data/saudi_usage_terms_v2.json',import.meta.url),'utf8'));
const normalize=value=>String(value||'').normalize('NFKC').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function findSaudiUsageTerms(text,{limit=8}={}){
 const normalized=' '+normalize(text).slice(0,3000)+' ';
 return catalog.terms.filter(term=>term.aliases.some(alias=>normalized.includes(' '+normalize(alias)+' ')))
  .slice(0,Math.max(0,Math.min(16,limit))).map(({id,meaning_ar,meaning_en})=>({id,meaning_ar,meaning_en,source:'curated_usage_mapping',diagnosisConfirmed:false}));
}
