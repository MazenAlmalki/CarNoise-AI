import test from 'node:test';
import assert from 'node:assert/strict';
import {chatProvider,publicChatConfiguration,DEFAULT_CHAT_MODEL,DEFAULT_CHAT_API_URL} from '../server/chatProvider.js';
import {readFileSync} from 'node:fs';

test('hosted Llama 3.3 and HTTPS API are the default instead of Qwen/Ollama',()=>{
 assert.equal(DEFAULT_CHAT_MODEL,'meta-llama/llama-3.3-70b-instruct');
 assert.equal(DEFAULT_CHAT_API_URL,'https://openrouter.ai/api/v1/chat/completions');
 const provider=chatProvider({CHAT_API_KEY:'testing-key'});
 assert.equal(provider.model,DEFAULT_CHAT_MODEL);
 assert.equal(provider.endpoint,DEFAULT_CHAT_API_URL);
 assert.equal(provider.local,false);
});

test('missing key fails closed, API endpoint cannot silently fall back to Ollama',()=>{
 assert.throws(()=>chatProvider({}),/CHAT_API_KEY_MISSING/);
 assert.equal(publicChatConfiguration({}).configured,false);
});

test('rejects non-HTTPS remote endpoints',()=>{
 assert.throws(()=>chatProvider({CHAT_API_KEY:'test',CHAT_API_URL:'http://example.com/api'}),/HTTPS/);
});

test('uses user-specified model and secure API endpoint',()=>{
 const info=chatProvider({CHAT_API_URL:'https://api.example.com/chat/completions',CHAT_API_KEY:'abc',CHAT_MODEL:'meta-llama/llama-4-maverick'});
 assert.equal(info.model,'meta-llama/llama-4-maverick');
 assert.equal(info.key,'abc');
});

test('server routes both chat and legacy analysis through hosted API helper',()=>{
 const server=readFileSync(new URL('../server/index.js',import.meta.url),'utf8');
 assert.ok((server.match(/chatProvider\(\)/g)||[]).length>=2);
 assert.ok(server.includes('payload?.choices?.[0]?.message?.content'));
 assert.ok(server.includes('chatApiConfigured'));
 assert.ok(!server.includes("||'qwen3.5:2b'"));
});

test('dotenv template keeps keys out of files tracked by git',()=>{
 const example=readFileSync(new URL('../.env.example',import.meta.url),'utf8');
 assert.match(example,/CHAT_API_URL=https:\/\/openrouter.ai\/api\/v1\/chat\/completions/);
 assert.match(example,/CHAT_API_KEY=\s*\n/);
 assert.match(example,/CHAT_MODEL=meta-llama\/llama-3.3-70b-instruct/);
});
