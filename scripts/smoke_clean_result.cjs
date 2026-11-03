// Actual registered upload + result API/UI; only optional speech is mocked.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const file=process.argv[2];if(!file)throw Error('Supply one registered MP4.');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>localStorage.setItem('warshatak-voice',JSON.stringify({auto:false,engine:'gemini'})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let spoken='';
  await page.route('**/api/speech/status',r=>r.fulfill({json:{configured:true,provider:'gemini',voice:'Charon',voices:['Charon']}}));
  await page.route('**/api/speech',r=>{spoken=r.request().postDataJSON().text;return r.fulfill({contentType:'audio/wav',body:fs.readFileSync('public/assets/sound-check.wav')});});
  await page.goto(process.env.SMOKE_URL||'http://127.0.0.1:3011');await page.locator('[data-intro=skip]').click();await page.locator('#cinematicIntro').waitFor({state:'hidden'});
  await page.locator('#mediaInput').setInputFiles(file);await page.locator('#description').fill('حلل المرفق');await page.locator('#sendButton').click();
  const card=page.locator('.sound-result');await card.waitFor({timeout:40000});await page.locator('#busy').waitFor({state:'hidden'});
  assert.equal(await card.locator('h3').textContent(),'المشكلة المحتملة');assert.equal(await card.locator('.sound-result-name').textContent(),'بطة السير');
  assert.equal(await card.locator('li').count(),2);assert.match(await card.locator('.sound-result-source').textContent(),/المصدر/);
  assert.doesNotMatch(await card.textContent(),/وش تعرّفنا|مطابق بالبايت|نفس الملف|بصمة|SHA|HMAC|PCM|API|تسجيل مرجعي معروف/);
  await page.locator('.message.assistant .read-reply').last().click();await page.waitForFunction(()=>document.body.dataset.speechState==='speaking');
  assert.match(spoken,/المشكلة المحتملة/);assert.doesNotMatch(spoken,/بايت|بصمة|نفس الملف|SHA|PCM/);await page.locator('#stopSpeech').click();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  const legacy=await page.evaluate(async()=>{
   const {renderSoundResult,soundResultNarration}=await import('/sound-result.js');
   const old={version:1,status:'known_recording',title:'Known reference recording',problem:'Brake pads',why:'Exact file identity byte-for-byte',labelNote:'SHA256 matched',steps:['Inspect brakes'],sources:[]};
   return {text:renderSoundResult(old,'en').textContent,narration:soundResultNarration(old,'en')};
  });assert.match(legacy.text,/Possible problem/);assert.match(legacy.text,/Suggested steps/);assert.doesNotMatch(legacy.text+' '+legacy.narration,/byte-for-byte|SHA256|Known reference recording/);
  assert.deepEqual(errors,[]);console.log('PASS clean Arabic/English card and manual speech: possible problem, inspection steps and source; old identity jargon hidden without changing history; actual upload, 30-second pacing and responsive layout. TTS mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
