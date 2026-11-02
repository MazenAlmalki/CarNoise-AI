import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planMinimalQuestions,enforceQuestionBudget} from '../server/minimalQuestions.js';
import {retrieveConditionalPatterns,conditionalPatternStats} from '../server/conditionalNoiseRetrieval.js';

test('if timing and texture already known, no more questions',()=>{
 const p=planMinimalQuestions({messages:[],current:'اسمع صرير لما افرمل'});
 assert.equal(p.askQuestion,false);
 assert.ok(p.answeredFields>=2);
 assert.equal(enforceQuestionBudget('قد تكون فحمات. وش نوع الصوت؟',p), 'قد تكون فحمات.');
});
test('one highly relevant clarification only for vague complaint',()=>{
 const p=planMinimalQuestions({messages:[],current:'صوت غريب'});
 assert.equal(p.askQuestion,true);
 assert.equal(p.questionType,'timing');
 const answer=enforceQuestionBudget('أحتاج تفاصيل. وش الصوت؟ ومتى؟',p);
 assert.equal((answer.match(/؟/g)||[]).length,1);
 assert.match(answer,/متى يظهر الصوت/);
});
test('do not repeat questions already asked in chat',()=>{
 const messages=[
 {role:'assistant',content:'متى تسمع الصوت؟'},
 {role:'user',content:'عند الفرامل'},
 {role:'assistant',content:'كيف توصف الصوت؟'},
 {role:'user',content:'صرير'},
 ];
 const p=planMinimalQuestions({messages,current:'ايه صرير وقت الفرامل'});
 assert.equal(p.askQuestion,false);
 assert.equal(p.questionBudget,0);
});
test('if the car may be unsafe, prioritize safety without questions',()=>{
 const p=planMinimalQuestions({messages:[],current:'الفرامل ما تمسك وعندي دخان'});
 assert.equal(p.urgent,true);
 assert.equal(p.askQuestion,false);
});
test('educational scenarios are independent of unverified audio',()=>{
 const cards=JSON.parse(readFileSync(new URL('../data/conditional_noise_patterns_v1.json',import.meta.url),'utf8'));
 assert.equal(cards.length,30);
 assert.equal(conditionalPatternStats().patterns,30);
 assert.ok(conditionalPatternStats().uniqueSources>=6);
 assert.ok(cards.every(x=>x.recording_verified===false&&x.diagnosis_confirmed===false));
 assert.ok(cards.every(x=>x.source_url.startsWith('https://')));
});
test('brake-specific conditional retrieval uses at least two user features',()=>{
 assert.equal(retrieveConditionalPatterns('صوت غريب').length,0);
 const results=retrieveConditionalPatterns('صرير وقت الفرامل من الكفرات');
 assert.ok(results.some(x=>x.id==='brake_squeal'));
 assert.ok(results.every(x=>x.matchCount>=2));
 assert.ok(results.every(x=>x.diagnosis_confirmed===false));
});
