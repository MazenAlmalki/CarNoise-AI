import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Regression for a UI bug: renderSession() disables media controls while a
// response is pending. They must be restored in sendChat's finally block.
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('media controls are re-enabled after a chat finishes, including failed requests',()=>{
 const start=app.indexOf('async function sendChat(');
 const end=app.indexOf('function renderSession()',start);
 assert.ok(start>=0 && end>start);
 const chat=app.slice(start,end);
 const lastFinally=chat.lastIndexOf('}finally{');
 assert.ok(lastFinally>=0);
 const cleanup=chat.slice(lastFinally);
 assert.match(cleanup,/submitting=false/);
 assert.match(cleanup,/\$\('attachButton'\)\.disabled=false/);
 assert.match(cleanup,/\$\('recordButton'\)\.disabled=false/);
});
test('a continuing conversation accepts pending recording attachment',()=>{
 const start=app.indexOf('async function sendChat(');
 const end=app.indexOf('function renderSession()',start);
 const chat=app.slice(start,end);
 assert.match(chat,/if\(pendingMedia\)/);
 assert.match(chat,/await saveBlob\(id,pendingMedia\)/);
 assert.match(chat,/if\(active\.mediaId && !active\.mediaAttempted\)/);
});
