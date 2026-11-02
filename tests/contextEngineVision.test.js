import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContextEngine} from '../server/contextEngine.js';
import {describeVehicleImages,DEFAULT_VISION_MODEL,visionConfiguration} from '../server/llamaVision.js';
import {readFileSync} from 'node:fs';

const messages=[
 {role:'user',content:'سيارتي ترج وهي واقفة'},
 {role:'assistant',content:'ممكن كراسي المكينة خربانة بنسبة 100%'},
 {role:'user',content:'الرجفة تزيد لما اشغل المكيف'},
 {role:'assistant',content:'هل تسمع صوت؟'},
 {role:'user',content:'ايه وفيه صوت صرير'}
];

test('context engine remembers prior user complaints and latest details',()=>{
 const x=buildContextEngine({messages,current:'يطلع بعد تشغيل المكيف'});
 assert.ok(x.userReportedDetails.some(t=>t.includes('ترج وهي واقفة')));
 assert.ok(x.userReportedDetails.some(t=>t.includes('تزيد لما اشغل المكيف')));
 assert.match(x.retrievalQuery,/المكيف/);
 assert.ok(!x.userReportedDetails.some(t=>t.includes('بنسبة 100%')));
});

test('correction is preserved without silently confirming a diagnosis',()=>{
 const x=buildContextEngine({messages,current:'لا قصدي من جهة الكفرات مو المكينة'});
 assert.match(x.latestUserCorrection,/جهة الكفرات/);
 assert.ok(x.instructions.some(t=>t.includes('correction')));
 assert.ok(!x.userReportedDetails.some(t=>t.includes('بنسبة 100%')));
});

test('context holds prior vehicle cases only as unverified history',()=>{
 const x=buildContextEngine({messages,current:'وكم يكلف؟',vehicleHistory:[
  {date:'2026-10-01',description:'صوت من العجل',suspectedSummary:'مشكلة رمان بلي'}
 ]});
 assert.equal(x.priorCaseHistory[0].diagnosisConfirmed,false);
 assert.equal(x.priorCaseHistory[0].userDescription,'صوت من العجل');
});

test('waveform and CLAP limits are explicit in media context',()=>{
 const x=buildContextEngine({messages,current:'وش في المقطع',mediaInsight:{
  type:'audio',waveform:{level:'loud'},audioEventAnalysis:{attempted:false,succeeded:false}
 }});
 assert.equal(x.mediaEvidence.soundClassifierRan,false);
 assert.match(x.mediaEvidence.limitation,/NOT a recognized car sound/);
});

test('vision uses remote Llama Scout and the private text API key',()=>{
 const cfg=visionConfiguration({CHAT_API_KEY:'test-key'});
 assert.equal(cfg.model,DEFAULT_VISION_MODEL);
 assert.equal(cfg.model,'meta-llama/llama-4-scout');
 assert.equal(cfg.local,false);
});

test('vision sends proper OpenAI-compatible image content and never sends key in model output',async()=>{
 let request=null;
 const mock=async (url,options)=>{
  request={url,headers:options.headers,body:JSON.parse(options.body)};
  return {ok:true,json:async()=>({choices:[{message:{content:'تظهر لمبة تحذير على الطبلون، لكن سببها غير واضح.'}}]})};
 };
 const result=await describeVehicleImages([{mimeType:'image/jpeg',base64:'AQIDBA=='}],'ar',{
  env:{CHAT_API_KEY:'secret-not-in-output'},fetchImpl:mock
 });
 assert.equal(request.body.model,'meta-llama/llama-4-scout');
 assert.equal(request.body.messages[0].content[1].type,'image_url');
 assert.ok(request.body.messages[0].content[1].image_url.url.startsWith('data:image/jpeg;base64,'));
 assert.equal(request.headers.Authorization,'Bearer secret-not-in-output');
 assert.ok(!JSON.stringify(result).includes('secret-not-in-output'));
 assert.match(result.description,/لمبة تحذير/);
});

test('untrusted image mime and oversized image payload are rejected before calling provider',async()=>{
 const never=async()=>{throw Error('should not call');};
 await assert.rejects(()=>describeVehicleImages([{mimeType:'image/svg+xml',base64:'AAAA'}],'en',{env:{CHAT_API_KEY:'test'},fetchImpl:never}),/Unsupported/);
 await assert.rejects(()=>describeVehicleImages([{mimeType:'image/jpeg',base64:'A'.repeat(9*1024*1024)}],'en',{env:{CHAT_API_KEY:'test'},fetchImpl:never}),/too large/);
});

test('active code no longer has Qwen or Ollama dependency',()=>{
 const server=readFileSync(new URL('../server/index.js',import.meta.url),'utf8');
 const media=readFileSync(new URL('../server/multimodal.js',import.meta.url),'utf8');
 const env=readFileSync(new URL('../.env.example',import.meta.url),'utf8');
 assert.doesNotMatch(server,/qwen|ollama/i);
 assert.doesNotMatch(media,/qwen|ollama/i);
 assert.doesNotMatch(env,/qwen|ollama/i);
 assert.ok(server.includes('buildContextEngine('));
 assert.ok(media.includes('describeVehicleImages('));
});
