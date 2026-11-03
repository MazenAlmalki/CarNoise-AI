import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
async function listen(server){server.listen(0,'127.0.0.1');await once(server,'listening');return server.address().port;}

test('chat consumes Gemini audio evidence, preserves speech, and falls back honestly on failure/silence',async t=>{
 const requests=[];
 const provider=http.createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  requests.push(JSON.parse(raw));res.setHeader('Content-Type','application/json');
  const last=requests.at(-1).messages.at(-1).content;
  const reply=requests.at(-1).messages.some(m=>m.content.includes('FORCE_WRONG_LANGUAGE'))?'Always English.':last.includes('أعد كتابة الجواب السابق')?'وعليكم السلام! كيف أقدر أساعدك؟':last==='مرحبا'?'أهلًا بك!':/سلام عليكم/.test(last)?'وعليكم السلام! كيف أقدر أساعدك؟':last==='Hello'?'Hello! How can I help?':last==='What is a CV joint?'?'A CV joint transfers rotation while allowing an axle to change angle.':last.includes('What should I do next')?'When does it happen?':'A squeal may have several causes. Its source is not confirmed.';
  res.end(JSON.stringify({choices:[{message:{content:reply}}]}));
 });
 const providerPort=await listen(provider);t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const probe=http.createServer();const appPort=await listen(probe);await new Promise(resolve=>probe.close(resolve));
 const child=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,PORT:String(appPort),CHAT_API_URL:`http://127.0.0.1:${providerPort}/v1/chat/completions`,CHAT_API_KEY:'local-test-key',CHAT_MODEL:'test-model',AUDIO_PROVIDER:'gemini',GEMINI_API_KEY:'',GEMINI_AUDIO_MODEL:'gemini-test-audio'},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{if(child.exitCode===null){const closed=once(child,'close');child.kill();await closed;}});
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Test server did not start')),7000);
  child.stdout.on('data',chunk=>{if(String(chunk).includes('server running')){clearTimeout(timeout);resolve();}});
  child.once('error',error=>{clearTimeout(timeout);reject(error);});
  child.once('exit',code=>{clearTimeout(timeout);reject(Error('Test server exited '+code));});
 });
 const base=`http://127.0.0.1:${appPort}`;
 const insight={type:'audio',audioEventAnalysis:{provider:'gemini',model:'gemini-test-audio',attempted:true,succeeded:true},audioObservation:{provider:'gemini',description:'Repeated high-pitched squealing is audible.',sounds:['squeal'],hasClearSound:true,uncertainty:'Source unknown.',diagnosisConfirmed:false},transcription:{hasRecognizedSpeech:false,text:''}};
 async function chat(mediaInsight,extra={}){const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Analyze the attachment',language:'en',mediaInsight,...extra})});assert.equal(response.status,200);return response.json();}
 const status=await (await fetch(base+'/api/model-status')).json();assert.equal(status.audio.provider,'gemini');assert.equal(status.audio.configured,false);
 const reply=await chat(insight);assert.equal(reply.grounding,'language-model-with-retrieval');assert.equal(requests.length,1);
 assert.match(JSON.stringify(requests[0]),/Repeated high-pitched squealing/);
 assert.match(JSON.stringify(requests[0]),/NOT a diagnosed fault/);
 const failed=await chat({...insight,audioEventAnalysis:{...insight.audioEventAnalysis,succeeded:false},audioObservation:null,warnings:['Gemini audio analysis failed: quota reached.']});
 assert.equal(failed.audioStatus,'classifier-error');assert.match(failed.audioError,/Gemini.*quota/);assert.equal(requests.length,1);
 const silent=await chat({...insight,audioObservation:{...insight.audioObservation,hasClearSound:false,sounds:[]}});
 assert.equal(silent.audioStatus,'no-candidates');assert.equal(requests.length,1);
 const speech=await chat({...insight,audioObservation:{...insight.audioObservation,hasClearSound:false,sounds:[]},transcription:{hasRecognizedSpeech:true,text:'السلام عليكم'}});
 assert.equal(speech.grounding,'language-model-with-retrieval');assert.equal(requests.length,2);
 assert.match(requests[1].messages.at(-1).content,/السلام عليكم/);
 const fallbackSpeech=await chat({...insight,audioEventAnalysis:{...insight.audioEventAnalysis,succeeded:false},audioObservation:null,
  transcription:{hasRecognizedSpeech:true,text:'The car squeals when braking',source:'groq_whisper_transcript_may_contain_errors'},
  speechTranscriptionAnalysis:{attempted:true,provider:'groq',succeeded:true},warnings:['Gemini audio analysis failed: quota reached.']});
 assert.equal(fallbackSpeech.grounding,'language-model-with-retrieval');assert.equal(requests.length,3);
 assert.match(requests[2].messages.at(-1).content,/The car squeals when braking/);
 const direct=await chat(null,{message:'What should I do next',vehicle:{name:'Camry 2018'},messages:[{role:'user',content:'It is still happening'}],
  questionMemory:{questionsAsked:2,askedFields:['timing','location'],lastQuestions:['When does it happen?','Where does it come from?'],userDetails:['My brakes squeal when braking']}});
 assert.equal(direct.grounding,'language-model-with-retrieval');assert.doesNotMatch(direct.reply,/\?/);assert.match(direct.reply,/brake|friction|pad/i);
 const context=JSON.parse(requests[3].messages.find(x=>x.role==='system'&&x.content.startsWith('{"responseLanguage"')).content);
 assert.equal(context.questionPlan.askQuestion,false);assert.equal(context.questionPlan.questionBudget,0);assert.equal(context.vehicle.modelId,'toyota-camry');assert.equal(context.vehicle.year,2018);
 assert.ok(context.contextEngine.userReportedDetails.some(x=>x.includes('brakes squeal')));assert.ok(JSON.stringify(context.vehicle).length<1000);
 const greeting=await chat(null,{message:'سلام عليكم',language:'ar'});
 assert.equal(greeting.reply,'وعليكم السلام! كيف أقدر أساعدك؟');assert.doesNotMatch(greeting.reply,/متى|الصوت|الفرامل/);
 const greetingContext=JSON.parse(requests[4].messages.find(x=>x.role==='system'&&x.content.startsWith('{"responseLanguage"')).content);
 assert.equal(greetingContext.questionPlan.conversationMode,'greeting');assert.equal(greetingContext.questionPlan.askQuestion,false);assert.deepEqual(greeting.knowledgeMatches,[]);
 const englishGreeting=await chat(null,{message:'Hello',language:'en'});assert.equal(englishGreeting.reply,'Hello! How can I help?');
 const information=await chat(null,{message:'What is a CV joint?',language:'en'});assert.match(information.reply,/transfers rotation/);assert.doesNotMatch(information.reply,/When does|Does it sound/);
 const welcome=await chat(null,{message:'مرحبا',language:'ar'});assert.equal(welcome.reply,'أهلًا بك!','greeting cleanup must not delete a genuine welcome');
 const clearReference={result:'clear',needsClarification:false,matches:[{id:'upload1-02',label_ar:'القماشات',label_en:'Brake pads',faultVerified:false}],reason:'Similar sound, uncertain mechanical source.',diagnosisConfirmed:false};
 const beforeReference=requests.length;
 const matched=await chat({...insight,audioObservation:{...insight.audioObservation,referenceComparison:clearReference}});
 assert.equal((matched.reply.match(/[?؟]/g)||[]).length,1);assert.equal(matched.referenceExample.id,'upload1-02');
 const matchedContext=JSON.parse(requests[beforeReference].messages.find(x=>x.role==='system'&&x.content.startsWith('{"responseLanguage"')).content);
 assert.equal(matchedContext.questionPlan.askQuestion,false);assert.match(matchedContext.mediaInsight,/upload1-02/);
 await chat({...insight,audioObservation:{...insight.audioObservation,referenceComparison:{...clearReference,result:'partial',needsClarification:true}}});
 const partialContext=JSON.parse(requests[beforeReference+1].messages.find(x=>x.role==='system'&&x.content.startsWith('{"responseLanguage"')).content);
 assert.equal(partialContext.questionPlan.askQuestion,false);assert.equal(partialContext.questionPlan.questionBudget,0);
 const imitation={...insight,audioObservation:{...insight.audioObservation,hasClearSound:false,sounds:[],soundOrigin:'human_vocal_imitation',originReason:'Audible vocal articulation and breath.'}};
 const providerCount=requests.length;
 const joke=await chat(imitation,{language:'ar'});assert.equal(joke.grounding,'human-vocal-imitation');assert.match(joke.reply,/V8/);assert.equal(requests.length,providerCount);assert.deepEqual(joke.knowledgeMatches,[]);
 const jokeEnglish=await chat(imitation,{language:'en'});assert.match(jokeEnglish.reply,/fuel economy/);
 const uncertainImitation=await chat({...imitation,audioObservation:{...imitation.audioObservation,soundOrigin:'uncertain'}});assert.notEqual(uncertainImitation.grounding,'human-vocal-imitation');
 const emergency=await chat(imitation,{messages:[{role:'user',content:'brake failure, the car will not stop'}]});assert.notEqual(emergency.grounding,'human-vocal-imitation');
 const humanSpeech=await chat({...imitation,transcription:{hasRecognizedSpeech:true,text:'السلام عليكم'}},{language:'ar'});assert.notEqual(humanSpeech.grounding,'human-vocal-imitation');assert.match(humanSpeech.reply,/وعليكم/);
 const speechRequest=requests.find(x=>x.messages.at(-1).content.includes('أجب عن كلامه بالعربية'));
 assert.ok(speechRequest,'Arabic transcript must use an Arabic request wrapper');
 assert.equal(JSON.parse(speechRequest.messages.find(x=>x.role==='system'&&x.content.startsWith('{"responseLanguage"')).content).responseLanguage,'ar');
 const spokenArabic={...insight,audioObservation:null,transcription:{hasRecognizedSpeech:true,text:'salam alaikum',language:'ar-SA'}};
 const beforeRepair=requests.length;
 const correctedArabic=await chat(spokenArabic,{message:'Listen to this voice note',language:'en'});
 assert.equal(correctedArabic.responseLanguage,'ar');assert.match(correctedArabic.reply,/وعليكم السلام/);
 assert.equal(requests.length,beforeRepair+2,'one correction if the provider first responds in English');
 assert.match(requests.at(-1).messages.at(-1).content,/أعد كتابة الجواب السابق بالعربية/);
 const refused=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Analyze the recording',language:'en',mediaInsight:{...insight,transcription:{hasRecognizedSpeech:true,text:'FORCE_WRONG_LANGUAGE',language:'ar'}}})});
 assert.equal(refused.status,502);const refusal=await refused.json();assert.match(refusal.error,/رد عربي/);assert.equal(refusal.reply,undefined,'an uncorrected English response must never be sent as the Arabic answer');
 const skipResponse=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'What should I do next',language:'en',skipClarification:true,messages:[{role:'user',content:'There is a strange car noise'}]})});
 assert.equal(skipResponse.status,200);assert.match(skipResponse.headers.get('server-timing'),/application;dur=\d+/);
 const skipped=await skipResponse.json();assert.doesNotMatch(skipped.reply,/[?؟]/);assert.equal(skipped.canSkipQuestion,false);assert.equal(skipped.problemSummary.assessment,skipped.reply);assert.equal(skipped.problemSummary.urgent,false);assert.ok(skipped.timings.stages.chatProviderHeaders.ms>=0);
 const skipContext=JSON.parse(requests.at(-1).messages.find(x=>x.role==='system'&&x.content.startsWith('{"responseLanguage"')).content);assert.equal(skipContext.questionPlan.askQuestion,false);assert.equal(skipContext.questionPlan.questionBudget,0);
 const skippedFailure=await chat({...insight,audioObservation:null,audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:false}},{skipClarification:true});assert.equal(skippedFailure.grounding,'language-model-with-retrieval');assert.equal(skippedFailure.canSkipQuestion,false);assert.doesNotMatch(skippedFailure.reply,/[?؟]/);
});
