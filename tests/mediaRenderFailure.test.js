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

test('CLAP runtime errors are reported rather than hidden behind guesses',()=>{
 assert.match(server,/audioStatus:'classifier-error'/);
 assert.match(server,/audioError:typeof failure/);
 assert.match(app,/data\.audioStatus==='classifier-error'/);
 assert.match(app,/showError\(\(state\.lang==='ar'\?'فشل مودل CLAP/);
});
