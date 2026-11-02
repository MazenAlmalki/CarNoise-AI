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

test('classifier failures report errors instead of offering generic sound guesses',()=>{
 const start=server.indexOf("app.post('/api/chat'");
 const end=server.indexOf('const history=buildChatHistory(',start);
 const route=server.slice(start,end);
 assert.ok(route.includes("!spokenText"));
 assert.ok(route.includes("mediaObject?.audioEventAnalysis?.attempted===true"));
 assert.ok(route.includes("audio-classifier-not-configured"));
 assert.ok(route.includes("if(!classified && wasAttempted){"));
 assert.ok(route.includes("audio-classifier-error"));
 assert.ok(route.includes("audioError:typeof failure"));
 assert.ok(!route.includes("return res.json(mediaClarification(language));"));
});

test('user can select a sound from assistant response and send it to chat',()=>{
 assert.ok(app.includes("clarificationOptions:Array.isArray(data.clarificationOptions)"));
 assert.ok(app.includes("renderAudioClarifications(msg,index===session.messages.length-1)"));
 assert.ok(app.includes("button.addEventListener('click'"));
 assert.ok(app.includes("$('description').value=choice.text"));
 assert.ok(app.includes("$('composer').requestSubmit()"));
 assert.ok(app.includes("button.disabled=!isLatest||submitting"));
 assert.ok(app.includes("active.messages.at(-1)?.clarificationOptions?.length)renderSession()"));
});
