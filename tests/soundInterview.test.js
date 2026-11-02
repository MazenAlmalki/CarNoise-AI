import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beginSoundInterview,advanceSoundInterview,interviewStats} from '../server/soundInterview.js';
import {retrieveSoundReading,soundCorpusStats} from '../server/soundReferences.js';

test('unrecognized media opens with a location question, not a diagnosis',()=>{
 const first=beginSoundInterview({language:'ar',reason:'classifier-error',error:'CLAP import failed'});
 assert.match(first.reply,/وين تسمع الصوت/);
 assert.match(first.reply,/مودل الصوت تعطل/);
 assert.equal(first.audioError,'CLAP import failed');
 assert.equal(first.audioInterview.stage,'location');
 assert.ok(first.clarificationOptions.some(x=>x.value==='engine'));
 assert.ok(!first.reply.includes('سبب العطل هو'));
});
test('location -> timing -> texture, preserving only user choices',()=>{
 const first=beginSoundInterview({language:'ar'});
 const second=advanceSoundInterview({stage:'location',value:'engine',answers:first.audioInterview.answers},'ar');
 assert.equal(second.done,false);assert.equal(second.audioInterview.stage,'timing');
 assert.equal(second.audioInterview.answers.location,'engine');
 const third=advanceSoundInterview({stage:'timing',value:'idle',answers:second.audioInterview.answers},'ar');
 assert.equal(third.audioInterview.stage,'texture');
 assert.equal(third.audioInterview.answers.timing,'idle');
 const final=advanceSoundInterview({stage:'texture',value:'click',answers:third.audioInterview.answers},'ar');
 assert.equal(final.done,true);
 assert.deepEqual(final.answers,{location:'engine',timing:'idle',texture:'click'});
 assert.match(final.description,/المكان: من جهة المكينة/);
 assert.match(final.description,/وقت الصوت: وهي واقفة والمكينة شغالة/);
 assert.match(final.description,/نوعه: طقطقة/);
 assert.match(final.description,/ليس تعرفًا من المودل/);
});
test('reject invalid client-selected answers and missing prior stages',()=>{
 assert.equal(advanceSoundInterview({stage:'location',value:'forced-toyota-diagnosis',answers:{}},'ar'),null);
 assert.equal(advanceSoundInterview({stage:'timing',value:'braking',answers:{}},'ar'),null);
 assert.equal(advanceSoundInterview({stage:'texture',value:'click',answers:{location:'engine',timing:'invalid'}},'ar'),null);
});
test('English questions work without an Arabic diagnosis',()=>{
 const start=beginSoundInterview({language:'en',reason:'classifier-not-configured'});
 assert.match(start.reply,/Where do you hear/);
 const step=advanceSoundInterview({stage:'location',value:'wheels',answers:{}},'en');
 assert.match(step.reply,/When does the noise/);
});
test('educational YouTube sound references are not verified vehicle sound labels',()=>{
 const library=JSON.parse(readFileSync(new URL('../data/youtube_car_sound_references_v1.json',import.meta.url),'utf8'));
 assert.ok(library.length>=28);
 assert.ok(library.every(x=>x.url.startsWith('https://www.youtube.com/watch?')));
 assert.ok(library.every(x=>x.actual_audio_verified===false&&x.mechanical_fault_confirmed===false));
 assert.ok(soundCorpusStats().youtubeLinks>=28);
 assert.equal(soundCorpusStats().syntheticExamples,536);
});
test('source lookup requires descriptive text and never asserts an audio match',()=>{
 assert.equal(retrieveSoundReading('سيارتي غريبة').length,0);
 const matching=retrieveSoundReading('اسمع طقطقة لما ألف الدركسون');
 assert.ok(matching.some(x=>x.subject==='cv_joint_click'));
 assert.ok(matching.every(x=>x.audio_verified===false));
});
test('three stages have usable answer options',()=>{
 assert.deepEqual(interviewStats(),{location:6,timing:8,texture:10});
});
