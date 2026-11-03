// Real four uploads, local file/audio identity, HTTP matching and UI. No audio-inference mocks.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const paths=process.argv.slice(2);if(paths.length!==4)throw Error('Supply four original MP4 paths in order: brakes, battery, belt, strut mount.');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{
   localStorage.setItem('warshatak-voice',JSON.stringify({auto:true,engine:'gemini'}));
   localStorage.setItem('carnoise-garage-v2',JSON.stringify({cars:[{id:'one',name:'سيارتي'}],cases:[],carId:'one',lang:'ar',theme:'dark'}));
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let speechCalls=0;
  // Simulate configured speech to ensure free identity results do not auto-call TTS.
  await page.route('**/api/speech/status',r=>r.fulfill({json:{configured:true,provider:'gemini',voice:'Charon',voices:['Charon']}}));
  await page.route('**/api/speech',r=>{speechCalls++;return r.fulfill({status:429,json:{code:'SPEECH_QUOTA'}});});
  await page.goto(process.env.SMOKE_URL||'http://127.0.0.1:3009');await page.locator('[data-intro=skip]').click();await page.locator('#cinematicIntro').waitFor({state:'hidden'});
  for(let i=0;i<paths.length;i++){
   if(i)await page.locator('#newCaseSide').click();
   const analysis=page.waitForResponse(r=>r.url().endsWith('/api/media/analyze')&&r.request().method()==='POST');
   await page.locator('#mediaInput').setInputFiles(paths[i]);await page.locator('#description').fill('حلل المرفق');await page.locator('#sendButton').click();
   const media=await (await analysis).json();assert.ok(media.analysis.localReferenceIdentity);assert.equal(media.analysis.audioEventAnalysis.attempted,false);
   await page.locator('.sound-result[data-status=known_recording]').waitFor();await page.locator('#busy').waitFor({state:'hidden'});
   assert.equal(await page.locator('.sound-result-name').textContent(),['القماشات','البطارية','بطة السير','ربلة كرسي المساعد'][i]);
   assert.equal(await page.locator('.sound-result li').count(),2);assert.equal(speechCalls,0,'known recordings must not trigger paid automatic TTS');
   assert.equal(await page.locator('.speech-pending').count(),0);
  }
  // Filename changes do not affect exact audio identity.
  await page.locator('#newCaseSide').click();await page.locator('#mediaInput').setInputFiles({name:'البطارية.mp4',mimeType:'video/mp4',buffer:fs.readFileSync(paths[0])});await page.locator('#description').fill('راجع المقطع');await page.locator('#sendButton').click();await page.locator('.sound-result[data-status=known_recording]').waitFor();assert.equal(await page.locator('.sound-result-name').textContent(),'القماشات');
  assert.equal(speechCalls,0);
  const audio=page.locator('.sound-result audio');await page.locator('.sound-result summary').click();await audio.evaluate(a=>a.play());await page.waitForFunction(()=>document.querySelector('.sound-result audio').currentTime>0.05);await audio.evaluate(a=>a.pause());
  await page.locator('#languageSwitch').click();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  assert.deepEqual(errors,[]);console.log('PASS actual four videos: exact local recording identity, names and guidance, renamed-file rejection as a label source, real reference playback and no automatic TTS requests. No recognition-accuracy claim.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
