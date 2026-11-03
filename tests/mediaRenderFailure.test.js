import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const server=readFileSync(new URL('../server/index.js',import.meta.url),'utf8');

test('stale asynchronous media renders cannot attach duplicate players',()=>{
 assert.match(app,/\+\+mediaRenderVersion/);
 assert.match(app,/requestVersion!==mediaRenderVersion/);
 assert.match(app,/querySelectorAll\('\[data-saved-media-preview\]'\)/);
 assert.match(app,/attached\.dataset\.savedMediaPreview=id/);
});

test('runtime audio failure is visible without inferred sound or vehicle location',async()=>{
 const {nonMechanicalMediaReply}=await import('../server/audioContent.js');
 const result=nonMechanicalMediaReply({audioEventAnalysis:{attempted:true,succeeded:false},warnings:['CLAP unavailable']},'en');
 assert.equal(result.audioStatus,'classifier-error');assert.equal(result.audioInterview,undefined);
 assert.match(result.reply,/could not be analyzed/);assert.deepEqual(result.knowledgeMatches,[]);
});
