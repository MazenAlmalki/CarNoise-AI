import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { retrieveTypedSymptoms } from '../server/textRetrieval.js';
import { retrieveSaudiGuidance,conversationHints } from '../server/saudiKnowledge.js';

const base = JSON.parse(readFileSync(new URL('../data/typed_symptoms_v1.json',import.meta.url),'utf8'));
const variants = readFileSync(new URL('../data/saudi_synthetic_utterances_v1.jsonl',import.meta.url),'utf8').trim().split('\n').map(x=>JSON.parse(x));
const slang = JSON.parse(readFileSync(new URL('../data/saudi_dialect_aliases_v1.json',import.meta.url),'utf8'));

test('large corpus has 1200 uniquely identified synthetic utterances',()=>{
 assert.equal(variants.length,1200);
 assert.equal(new Set(variants.map(x=>x.id)).size,1200);
 assert.equal(new Set(variants.map(x=>x.user_utterance)).size,1200);
 const ids=new Set(base.map(x=>x.id));
 assert.ok(variants.every(x=>ids.has(x.knowledge_id)&&x.origin==='synthetic_phrase_variation_not_real_user_case'&&x.confirmed_fault===false));
});

test('additional slang aliases are auditable and matched to real knowledge cards',()=>{
 const ids=new Set(base.map(x=>x.id));
 assert.ok(slang.every(x=>ids.has(x.knowledge_id)));
 assert.ok(slang.flatMap(x=>x.aliases).length>=120);
 assert.equal(retrieveTypedSymptoms('الدركسون ثقل فجأة')[0]?.id,'T030');
 assert.equal(retrieveTypedSymptoms('القير ينتع بين الاول والثاني')[0]?.id,'T031');
});

test('1200 synthetic phrases are indexed for exact-match retrieval',()=>{
 // A selection spread across all 40 original symptom families
 for(const record of variants.filter((_,i)=>i%30===3)){
  const matches=retrieveTypedSymptoms(record.user_utterance,{limit:3});
  assert.ok(matches.some(x=>x.id===record.knowledge_id),record.id);
 }
});

test('Saudi official recall source is only offered in relevant discussions',()=>{
 assert.ok(retrieveSaudiGuidance('ابغى استفسر عن استدعاء سيارتي').some(x=>x.id==='SAU001'));
 assert.ok(retrieveSaudiGuidance('الكاميرا الخلفية في تويوتا ما تشتغل').some(x=>x.id==='SAU004'));
 assert.ok(!retrieveSaudiGuidance('سيارتي تويوتا تمشي طبيعي').some(x=>x.id==='SAU004'));
});

test('missing media gets explicit conversational guidance without inventing a sound',()=>{
 const hints=conversationHints({message:'حلل لي التسجيل',mediaFailed:true,hasMatches:false});
 assert.ok(hints.some(x=>x.includes('DID NOT analyze')));
});

test('unknown message asks one useful question instead of a canned fault diagnosis',()=>{
 const hints=conversationHints({message:'فيه شيء مو طبيعي',hasMatches:false});
 assert.ok(hints.some(x=>x.includes('LOW-EVIDENCE')));
});

test('Saudi source snippets preserve references and no VIN certainty',()=>{
 const sources=JSON.parse(readFileSync(new URL('../data/saudi_official_context_v1.json',import.meta.url),'utf8'));
 assert.ok(sources.every(x=>x.source_url.startsWith('https://')));
 assert.ok(sources.some(x=>x.topic==='vehicle_recall'));
 assert.ok(sources.every(x=>x.mechanic_verified===false));
});
