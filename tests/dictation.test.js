import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {transcribeDictation,dictationConfiguration} from '../server/dictation.js';
const env={SPEECH_FALLBACK:'groq',GROQ_API_KEY:'test-only',SPEECH_LANGUAGE:'auto'};
function recording(seconds=1){
 const pcm=Buffer.alloc(32000*seconds),h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(pcm.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(16000,24);h.writeUInt32LE(32000,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return {mimetype:'audio/wav',buffer:Buffer.concat([h,pcm])};
}
test('dictation normalizes real audio but calls only ASR, keeping Arabic original words',async()=>{
 const before=(await readdir(tmpdir())).filter(x=>x.startsWith('warshatak-dictation-'));
 let calls=0;
 const result=await transcribeDictation(recording(),{env,fetchImpl:async(url,request)=>{
  calls++;assert.equal(url,'https://api.groq.com/openai/v1/audio/transcriptions');
  assert.equal(request.body.get('language'),null);assert.equal(request.body.get('response_format'),'verbose_json');
  assert.ok((await request.body.get('file').arrayBuffer()).byteLength>44);
  return {ok:true,json:async()=>({language:'ar',segments:[{text:'السلام عليكم',no_speech_prob:0.01,avg_logprob:-0.1}]})};
 }});
 assert.equal(calls,1);assert.equal(result.text,'السلام عليكم');assert.equal(result.requiresUserReview,true);
 assert.deepEqual((await readdir(tmpdir())).filter(x=>x.startsWith('warshatak-dictation-')).sort(),before.sort());
});
test('missing ASR, silence, unsupported media, long recordings and cancellation never invoke a sound model',async()=>{
 assert.equal(dictationConfiguration({SPEECH_FALLBACK:'none'}).configured,false);
 await assert.rejects(transcribeDictation(recording(),{env:{SPEECH_FALLBACK:'none'}}),{status:503});
 await assert.rejects(transcribeDictation({mimetype:'video/mp4',buffer:Buffer.from('bad')},{env}),{status:400});
 await assert.rejects(transcribeDictation(recording(61),{env,fetchImpl:()=>{throw Error('must not call provider')}}),{status:413});
 const result=await transcribeDictation(recording(),{env,fetchImpl:async()=>({ok:true,json:async()=>({segments:[{text:'invented words',no_speech_prob:0.99,avg_logprob:-3}]})})});
 assert.equal(result.text,'');assert.equal(result.hasRecognizedSpeech,false);
 await assert.rejects(transcribeDictation(recording(),{env,signal:AbortSignal.abort()}),{name:'AbortError'});
});
