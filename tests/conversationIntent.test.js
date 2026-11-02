import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyConversationTurn} from '../server/conversationIntent.js';
import {planMinimalQuestions,enforceQuestionBudget} from '../server/minimalQuestions.js';

const oldProblem=[{role:'user',content:'My brakes squeal when braking'},{role:'assistant',content:'It might involve friction.'}];

test('greetings never begin a fault interview, including after an older car complaint',()=>{
 for(const current of ['سلام عليكم','السلام عليكم ورحمة الله وبركاته','هلا والله','مرحبا','كيف حالك','hello','hi','how are you']){
  for(const messages of [[],oldProblem]){
   const plan=planMinimalQuestions({current,messages});
   assert.equal(plan.clarificationAllowed,false,current);assert.equal(plan.askQuestion,false,current);assert.equal(plan.stopAsking,true,current);
   assert.equal(plan.suggestedQuestion,null,current);
  }
 }
});

test('general and educational vehicle questions receive answers without assuming an experienced fault',()=>{
 for(const current of ['وش اسمك','وش تقدر تسوي','وش يعني بوري','وش الفرق بين القير العادي و CVT','What is engine knocking?','Explain brake pads','How does ABS work?','عندي مشكلة بالرياضيات']){
  const plan=planMinimalQuestions({current,messages:oldProblem});assert.equal(plan.clarificationAllowed,false,current);assert.equal(plan.askQuestion,false,current);
 }
});

test('a greeting with a real complaint is handled in the same turn and can clarify only what is missing',()=>{
 const plan=planMinimalQuestions({current:'السلام عليكم عندي صوت غريب بسيارتي'});
 assert.equal(plan.clarificationAllowed,true);assert.equal(plan.askQuestion,true);
 const supplied=planMinimalQuestions({current:'هلا، اسمع صرير لما افرمل'});
 assert.equal(supplied.clarificationAllowed,true);assert.equal(supplied.askQuestion,false);
 const ac=planMinimalQuestions({current:'مكيف السيارة ما يبرد'});
 assert.equal(ac.clarificationAllowed,true);assert.equal(enforceQuestionBudget('قد تكون مشكلة تبريد. هل الهواء يطلع من الفتحات؟',ac),'قد تكون مشكلة تبريد. هل الهواء يطلع من الفتحات؟');
});

test('real follow-ups preserve context, while thanks and a new greeting do not restart it',()=>{
 assert.equal(classifyConversationTurn({current:'I cannot tell',messages:[{role:'user',content:'My car makes a strange noise'}]}).clarificationAllowed,true);
 assert.equal(classifyConversationTurn({current:'I still hear it',messages:oldProblem}).clarificationAllowed,true);
 assert.equal(classifyConversationTurn({current:'مازال الصوت',messages:oldProblem}).clarificationAllowed,true);
 assert.equal(classifyConversationTurn({current:'thank you',messages:oldProblem}).clarificationAllowed,false);
 assert.equal(classifyConversationTurn({current:'Analyze the attachment',mediaRequested:true}).clarificationAllowed,true);
 assert.equal(classifyConversationTurn({current:'السلام عليكم',mediaRequested:true}).clarificationAllowed,false,'spoken greeting is not a car symptom');
});

test('the screenshot greeting is preserved and diagnostic questions are not added',()=>{
 const plan=planMinimalQuestions({current:'سلام عليكم'});
 assert.equal(enforceQuestionBudget('وعليكم السلام!',plan),'وعليكم السلام!');
 assert.equal(enforceQuestionBudget('وعليكم السلام! كيف أقدر أساعدك؟',plan),'وعليكم السلام! كيف أقدر أساعدك؟');
 assert.equal(enforceQuestionBudget('وعليكم السلام! متى يظهر الصوت بالضبط: عند التشغيل، الفرامل، اللف، المطبات، أو المشي؟',plan),'وعليكم السلام!');
 assert.equal(enforceQuestionBudget('Hello! When do you hear the noise?',plan,{language:'en'}),'Hello!');
 assert.equal(enforceQuestionBudget('Reference: https://example.com/help?id=1',plan,{language:'en'}),'Reference: https://example.com/help?id=1');
 assert.equal(enforceQuestionBudget('When braking, ABS can reduce wheel lock.',plan,{language:'en'}),'When braking, ABS can reduce wheel lock.');
});

test('problem replies do not get a canned question appended and only one useful natural question is retained',()=>{
 const plan=planMinimalQuestions({current:'My car makes a strange noise'});
 assert.equal(enforceQuestionBudget('Let’s look at the details you noticed.',plan,{language:'en'}),'Let’s look at the details you noticed.');
 const reply=enforceQuestionBudget('There are several possible sources. When do you notice it? Where does it come from?',plan,{language:'en'});
 assert.equal((reply.match(/\?/g)||[]).length,1);assert.match(reply,/When do you notice it\?/);assert.doesNotMatch(reply,/starting, braking/);
 const known=planMinimalQuestions({current:'It happens when braking',messages:[{role:'user',content:'My car makes a strange noise'}]});
 const next=enforceQuestionBudget('When does it happen? Does it sound like clicking or squealing?',known,{language:'en'});
 assert.doesNotMatch(next,/When does/);assert.match(next,/Does it sound/);
});
