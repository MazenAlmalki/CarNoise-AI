import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeQuestionMemory,mergeQuestionMemory} from '../public/questionMemory.js';
import {planMinimalQuestions,enforceQuestionBudget} from '../server/minimalQuestions.js';
import {retrieveConditionalPatterns} from '../server/conditionalNoiseRetrieval.js';
import {selectedVehicleContext,vehicleFocusStats} from '../server/vehicleContext.js';

test('case question budget survives truncation of the visible model history',()=>{
 const full=[{role:'user',content:'صوت بسيارتي'},{role:'assistant',content:'وين تسمع الصوت؟'},{role:'user',content:'ما ادري'},{role:'assistant',content:'متى يظهر الصوت؟'},{role:'user',content:'وقت الفرامل'}];
 for(let i=0;i<15;i++)full.push({role:'user',content:'تفصيل إضافي '+i},{role:'assistant',content:'أراجع التفاصيل معك.'});
 const memory=summarizeQuestionMemory(full);
 assert.equal(memory.questionsAsked,2);assert.ok(memory.askedFields.includes('location'));assert.ok(memory.askedFields.includes('timing'));
 const plan=planMinimalQuestions({messages:full.slice(-10),current:'وش الاحتمالات',questionMemory:memory});
 assert.equal(plan.askQuestion,false);assert.equal(plan.questionBudget,0);assert.equal(plan.known.timing.id,'braking');
});

test('unknown answers and reworded prompts do not repeat the same topic',()=>{
 const messages=[{role:'assistant',content:'When do you notice the noise?'},{role:'user',content:'I am not sure'}];
 const plan=planMinimalQuestions({messages,current:'I cannot tell'});
 assert.ok(plan.askedFields.includes('timing'));assert.notEqual(plan.questionType,'timing');
 assert.equal(plan.questionType,'texture');
});

test('late questions and imperative questions consume the same budget',()=>{
 const memory=summarizeQuestionMemory([{role:'assistant',content:'A'.repeat(900)+'. When does the noise occur?'},{role:'assistant',content:'Tell me where it comes from.'}]);
 assert.equal(memory.questionsAsked,2);assert.deepEqual(new Set(memory.askedFields),new Set(['timing','location']));
});

test('usable Gemini texture combines with user timing without becoming a confirmed fault',()=>{
 const plan=planMinimalQuestions({current:'It happens when braking',audioObservation:{hasClearSound:true,description:'High pitched squealing',sounds:['squeal']}});
 assert.equal(plan.answeredFields,2);assert.equal(plan.askQuestion,false);assert.equal(plan.known.texture.source,'hosted_audio_observation_uncertain');
});

test('enforcement removes repeated imperative requests, preserves links and can retain grounded guidance',()=>{
 const plan={askQuestion:false,questionBudget:0};
 const result=enforceQuestionBudget('Possible pad wear. Tell me when it happens. Reference: https://www.youtube.com/watch?v=fixture0001',plan,{language:'en'});
 assert.match(result,/Possible pad wear/);assert.doesNotMatch(result,/Tell me/);assert.match(result,/watch\?v=fixture0001/);
 assert.equal(enforceQuestionBudget('When does it happen?',plan,{language:'en',fallbackReply:'Possible friction. Have the brakes inspected.'}),'Possible friction. Have the brakes inspected.');
});

test('remembered user facts exclude assistant guesses and input memory stays bounded',()=>{
 const memory=summarizeQuestionMemory([{role:'assistant',content:'It might be the engine bearing.'},{role:'user',content:'صفير لما افرمل'}]);
 assert.ok(memory.userDetails.every(x=>!x.includes('bearing')));
 const merged=mergeQuestionMemory([],{questionsAsked:999,askedFields:['location','secret'],lastQuestions:['x'.repeat(10000)],userDetails:['y'.repeat(10000)]});
 assert.equal(merged.questionsAsked,50);assert.deepEqual(merged.askedFields,['location']);assert.ok(merged.userDetails[0].length<=250);
});

test('bounded vehicle focus recognizes Saudi aliases without claiming model-specific defects',()=>{
 assert.equal(vehicleFocusStats().models,18);assert.equal(vehicleFocusStats().verifiedSalesRanking,false);
 for(const [name,model] of [['كامري ٢٠١٨','toyota-camry'],['Hyundai Elantra 2020','hyundai-elantra'],['نيسان باترول','nissan-patrol']]){
  const context=selectedVehicleContext({name});assert.equal(context.modelId,model);assert.equal(context.engineVariant,'unknown');assert.match(context.coverage,/not_model_specific/);
 }
 assert.equal(selectedVehicleContext({name:'كامري ٢٠١٨'}).year,2018);
 assert.equal(selectedVehicleContext({name:'My car'}).recognized,false);
});

test('selected car persists unless an explicit current correction identifies a different model',()=>{
 assert.equal(selectedVehicleContext({name:'Camry 2018'},'There was a police patrol nearby').modelId,'toyota-camry');
 const corrected=selectedVehicleContext({name:'Camry 2018'},'I meant my car is a Corolla 2021');
 assert.equal(corrected.modelId,'toyota-corolla');assert.equal(corrected.year,2021);
 assert.equal(selectedVehicleContext({name:'Camry 2018'},'my car is a Corolla').year,null);
});


test('braking vibration retrieves its bilingual evidence without requiring a location question',()=>{
 const results=retrieveConditionalPatterns('The car shudders when braking');
 assert.ok(results.some(x=>x.id==='brake_shudder'));assert.ok(results.every(x=>x.symptom_en&&x.possible_causes_en?.length));
 const plan=planMinimalQuestions({current:'The car shudders when braking'});
 assert.equal(plan.askQuestion,false);
});
