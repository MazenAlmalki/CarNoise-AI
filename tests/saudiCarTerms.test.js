import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detectReplyLanguage} from '../server/chatLanguage.js';
import {findSaudiCarTerms,carTermStats} from '../server/saudiCarTerms.js';

test('English typing works even when UI language remains Arabic',()=>{
 assert.equal(detectReplyLanguage('My car makes a clicking noise when I turn','ar'),'en');
 assert.equal(detectReplyLanguage('What does parking brake mean?','ar'),'en');
 assert.equal(detectReplyLanguage('the horn is not working','ar'),'en');
});
test('Arabic typing works when UI remains English',()=>{
 assert.equal(detectReplyLanguage('سيارتي ما تدق سلف','en'),'ar');
 assert.equal(detectReplyLanguage('وش معنى بوري؟','en'),'ar');
});
test('short and numeric messages inherit UI locale',()=>{
 assert.equal(detectReplyLanguage('123','en'),'en');
 assert.equal(detectReplyLanguage('?','ar'),'ar');
});
test('core Saudi car slang is indexed with appropriate meanings',()=>{
 const horn=findSaudiCarTerms('البوري ما يشتغل');
 assert.ok(horn.some(x=>x.term==='بوري'&&x.meaning_en==='horn'));
 const brake=findSaudiCarTerms('الجلنط ما يمسك');
 assert.ok(brake.some(x=>x.term==='جلنط'&&x.meaning_en==='parking brake'));
});
test('English car terminology is recognized',()=>{
 assert.ok(findSaudiCarTerms('my horn does not work').some(x=>x.term==='بوري'));
 assert.ok(findSaudiCarTerms('parking brake warning on dashboard').some(x=>x.term==='جلنط'));
});
test('ambiguous expressions prompt clarification rather than confirmed fault',()=>{
 const terms=findSaudiCarTerms('سير المكينة يصفر');
 assert.ok(terms.some(x=>x.term==='سير المكينة'&&x.ambiguous));
});
test('large bilingual reply corpus is synthetic and covers all terms',()=>{
 const entries=JSON.parse(readFileSync(new URL('../data/saudi_car_terms_v1.json',import.meta.url),'utf8'));
 const dialog=readFileSync(new URL('../data/saudi_car_dialogue_examples_v1.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(entries.length,89);
 assert.equal(dialog.length,1068);
 assert.equal(new Set(dialog.map(x=>x.user_ar)).size,1068);
 assert.ok(entries.every(x=>x.mechanic_confirmed===false));
 assert.ok(dialog.every(x=>x.confirmed_diagnosis===false&&x.origin==='synthetic_author_examples_not_real_mechanic_cases'));
 assert.deepEqual(carTermStats(),{entries:89,variants:317});
});
