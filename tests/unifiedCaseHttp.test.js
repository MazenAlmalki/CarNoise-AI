import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

const listen=async server=>{server.listen(0,'127.0.0.1');await once(server,'listening');return server.address().port;};
test('HTTP chat forwards original text with separate evidence and validates uploads',async t=>{
 const requests=[];
 const provider=http.createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  requests.push(JSON.parse(raw));res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({choices:[{message:{content:'The reports may differ. Neither establishes a fault; keep both for inspection.'}}]}));
 });
 const providerPort=await listen(provider);t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const probe=http.createServer(),port=await listen(probe);await new Promise(resolve=>probe.close(resolve));
 const child=spawn(process.execPath,['server/index.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),CHAT_API_URL:`http://127.0.0.1:${providerPort}/v1/chat/completions`,CHAT_API_KEY:'test-only',CHAT_MODEL:'fixture',SPEECH_FALLBACK:'none'},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{if(child.exitCode===null){const closed=once(child,'close');child.kill();await closed;}});
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Server startup timed out')),7000);
  child.stdout.on('data',chunk=>{if(String(chunk).includes('server running')){clearTimeout(timeout);resolve();}});
  child.once('error',e=>{clearTimeout(timeout);reject(e);});child.once('exit',code=>{clearTimeout(timeout);reject(Error('Server exited '+code));});
 });
 const base=`http://127.0.0.1:${port}`;
 const missingASR=new FormData();missingASR.append('audio',new Blob(['RIFF'],{type:'audio/wav'}),'dictation.wav');
 const unavailable=await fetch(base+'/api/speech/transcribe',{method:'POST',body:missingASR});assert.equal(unavailable.status,503);assert.equal(unavailable.headers.get('cache-control'),'no-store');assert.equal(requests.length,0);
 const rejected=new FormData();rejected.append('audio',new Blob(['video'],{type:'video/mp4'}),'not-speech.mp4');assert.equal((await fetch(base+'/api/speech/transcribe',{method:'POST',body:rejected})).status,400);
 const message='Analyze the recording. My brakes squeal when braking, especially after a long drive.';
 const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,language:'en',vehicle:{name:'Camry 2018'},questionMemory:{vehicleStatements:['I meant my car is a Corolla 2021']},messages:[{role:'user',content:'It has been happening for a week'}],vehicleHistory:[{date:'2026-11-01',description:'A vibration',suspectedSummary:'An earlier guess'}],mediaInsight:{type:'video',transcription:{hasRecognizedSpeech:true,text:'There is no sound when braking'},audioEventAnalysis:{succeeded:true},audioObservation:{description:'An uncertain squeal',sounds:['squeal']},visual:{description:'A parked car'}}})});
 assert.equal(response.status,200);const body=await response.json();assert.ok(body.evidenceConflicts.length);
 const sent=requests[0];assert.equal(sent.messages.at(-1).content,message);
 const context=JSON.parse(sent.messages.find(m=>m.content.startsWith('{"responseLanguage"')).content);
 assert.equal(context.unifiedCase.writtenDescription,message);assert.equal(context.unifiedCase.transcript.text,'There is no sound when braking');assert.equal(context.unifiedCase.media.visual.verified,false);
 assert.equal(context.vehicle.modelId,'toyota-corolla');assert.equal(context.vehicle.year,2021);assert.equal(context.unifiedCase.history[0].verified,false);
 // Content routing never assumes the selected vehicle makes an arbitrary clip automotive.
 for(const type of ['music','silence','other','uncertain']){
  const count=requests.length;
  const routed=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Analyze the recording',language:'en',vehicle:{name:'Camry 2018'},mediaInsight:{type:'audio',audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:true},audioObservation:{provider:'gemini',contentType:type,hasMechanicalSound:false,hasClearSound:type==='music',description:'Unverified content',sounds:type==='music'?['music']:[]}}})});
  assert.equal(routed.status,200);const result=await routed.json();assert.equal(result.audioContent.type,type);assert.equal(result.audioInterview,undefined);assert.equal(result.problemSummary,null);assert.equal(requests.length,count);
 }
 const count=requests.length;
 const mixedMusic=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Analyze the recording',language:'en',mediaInsight:{type:'audio',audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:true},audioObservation:{provider:'gemini',contentType:'mixed',hasMechanicalSound:false,hasClearSound:true,description:'Voice and music',sounds:['music']}}})});
 assert.equal((await mixedMusic.json()).audioInterview,undefined);assert.equal(requests.length,count);
 for(const [type,bytes,expected] of [['image/svg+xml','<svg/>',400],['audio/wav','',422]]){
  const data=new FormData();data.append('media',new Blob([bytes],{type}),'fixture');
  const upload=await fetch(base+'/api/media/analyze',{method:'POST',body:data});assert.equal(upload.status,expected);assert.ok((await upload.json()).error);
 }
});
