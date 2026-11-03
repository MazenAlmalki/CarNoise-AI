import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const server=readFileSync(new URL('../server/index.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

test('unrecognized audio provides user-selectable descriptions without diagnoses',()=>{
 const start=server.indexOf('function unrecognizedAudioOptions(');
 const end=server.indexOf('app.post(\'/api/chat\'',start);
 assert.ok(start>=0&&end>start);
 const source=server.slice(start,end);
 for(const label of ['speech','clicking','squealing','whistling','humming','vibration','other']){
  assert.ok(source.includes("'"+label+"'"),label);
 }
 assert.ok(source.includes("clarificationOptions:unrecognizedAudioOptions(language)"));
 assert.ok(source.includes("ما قدرت أتعرف على الكلام أو نوع الصوت"));
});

test('unavailable classification never starts a vehicle interview',async()=>{
 const {nonMechanicalMediaReply}=await import('../server/audioContent.js');
 for(const attempted of [true,false]){
  const result=nonMechanicalMediaReply({audioEventAnalysis:{attempted,succeeded:false}},'en');
  assert.equal(result.audioInterview,undefined);assert.equal(result.clarificationOptions,undefined);
  assert.match(result.reply,/cannot|not configured/);assert.doesNotMatch(result.reply,/engine|where do you hear/i);
 }
});

test('user can select a sound from assistant response and send it to chat',()=>{
 assert.ok(app.includes("clarificationOptions:Array.isArray(data.clarificationOptions)"));
 assert.ok(app.includes("renderAudioClarifications(msg,index===session.messages.length-1)"));
 assert.ok(app.includes("button.addEventListener('click'"));
 assert.ok(app.includes("$('description').value=choice.text"));
 assert.ok(app.includes("$('composer').requestSubmit()"));
 assert.ok(app.includes("button.disabled=!isLatest||submitting"));
 assert.ok(app.includes("(active.messages.at(-1)?.clarificationOptions?.length||active.messages.at(-1)?.canSkipQuestion))renderSession()"));
 assert.ok(app.includes("audioInterviewAnswer:{"));
 assert.ok(app.includes("audioInterview:data.audioInterview"));
});
