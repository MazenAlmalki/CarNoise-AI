import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { interpretSaudiSpeech, dialectStats } from '../server/saudiDialect.js';
import { conversationHints } from '../server/saudiKnowledge.js';

test('dialect corpus is labeled as curated examples, not fault evidence',()=>{
 const glossary=JSON.parse(readFileSync(new URL('../data/saudi_dialect_glossary_v1.json',import.meta.url),'utf8'));
 const edges=readFileSync(new URL('../data/saudi_conversation_edge_cases_v1.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(glossary.length,128);
 assert.equal(edges.length,204);
 assert.ok(glossary.every(x=>x.provenance==='curated_language_example_not_corpus_observation'&&x.mechanic_confirmed===false));
 assert.ok(edges.every(x=>x.fixed_reply===false&&x.origin==='synthetic_variation_no_real_user_source'));
 assert.equal(new Set(edges.map(x=>x.utterance_ar)).size,204);
 assert.deepEqual(dialectStats(),{glossaryEntries:128,conversationExamples:204});
});

test('car slang is understood as language context, not diagnosed fault',()=>{
 const result=interpretSaudiSpeech('القير ينتع لما اوقف');
 assert.equal(result.intent,'ordinary');
 assert.ok(result.vocabulary.some(x=>x.term==='القير'));
 assert.ok(result.vocabulary.some(x=>x.term==='تنتع'));
});

test('nonliteral car complaints recognized as jokes',()=>{
 const result=interpretSaudiSpeech('سيارتي زعلانة مني');
 assert.equal(result.intent,'joke');
 assert.ok(result.conversationGuidance.includes('playful'));
 assert.equal(conversationHints({message:'سيارتي زعلانة مني',intent:result.intent,hasMatches:false}).some(x=>x.includes('LOW-EVIDENCE')),false);
});

test('accept user corrections instead of repeating a bad interpretation',()=>{
 assert.equal(interpretSaudiSpeech('ياخي ما فهمت قصدي').intent,'correction');
 assert.equal(interpretSaudiSpeech('لا مو كذا اقصد ترج مو تميل').intent,'correction');
});

test('greetings and unrelated questions do not force car diagnoses',()=>{
 for(const message of ['وش علومك','هلا يا ورشتك','كم عمرك']){
  const result=interpretSaudiSpeech(message);
  assert.ok(['greeting','not_vehicle'].includes(result.intent),message);
 }
});

test('unclear noise stays unclear and hints ask for one clarification',()=>{
 const result=interpretSaudiSpeech('اسمع صوت غريب بالسيارة');
 assert.equal(result.intent,'unclear');
 assert.ok(result.conversationGuidance.includes('ONE'));
});

test('ambiguous one-word messages are not inferred as defective vehicle parts',()=>{
 const result=interpretSaudiSpeech('لا');
 assert.equal(result.vocabulary.length,0);
 assert.equal(result.intent,'ordinary');
});

test('media-processing failure guidance does not hallucinate observations',()=>{
 const hints=conversationHints({message:'ما فهم صوتي',hasMatches:false,mediaFailed:true,intent:'media_failure'});
 assert.ok(hints.some(x=>x.includes('DID NOT analyze')));
});
