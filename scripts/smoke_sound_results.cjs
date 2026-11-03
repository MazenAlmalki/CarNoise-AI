// Real UI + compact-card HTTP logic + reference playback. Audio inference is MOCKED.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.SMOKE_URL||'http://127.0.0.1:3008';
const artifacts=process.env.SMOKE_ARTIFACTS||'/tmp/sound-result-smoke';fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{
   localStorage.setItem('warshatak-voice',JSON.stringify({auto:false}));
   if(!localStorage.getItem('sound-result-seeded')){localStorage.setItem('carnoise-garage-v2',JSON.stringify({cars:[{id:'one',name:'Camry 2018'}],cases:[],carId:'one',lang:'ar',theme:'dark'}));localStorage.setItem('sound-result-seeded','yes');}
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let mode='clear',uploads=0,requests=[];
  await page.route('**/api/speech/status',r=>r.fulfill({json:{configured:false}}));
  await page.route('**/api/chat',r=>{requests.push(r.request().postDataJSON());return r.continue();});
  await page.route('**/api/media/analyze',r=>{
   uploads++;
   if(mode==='failure')return r.fulfill({status:503,json:{error:'Fixture provider unavailable'}});
   const content=['speech','music','silence','other','uncertain','mixed'].includes(mode)?mode:'mechanical_sound';
   return r.fulfill({json:{analysis:{type:'audio',audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:true},audioObservation:{provider:'gemini',contentType:content,hasMechanicalSound:['clear','partial','ambiguous','mixed','unknown'].includes(mode),hasClearSound:!['speech','silence','uncertain'].includes(mode),description:'Unverified model observation',sounds:['squeal'],referenceComparison:{source:'gemini_direct_audio_reference_comparison',result:mode==='partial'?'partial':'clear',reason:'Similar pitch and repeating rhythm',matches:[{id:mode==='ambiguous'?'upload1-03':mode==='unknown'?'unknown':'upload1-02'}]}},transcription:{hasRecognizedSpeech:['speech','mixed'].includes(mode),text:mode==='speech'?'Hello':mode==='mixed'?'A squeal occurs when braking':''}}}});
  });
  await page.goto(root);await page.locator('[data-intro=skip]').click();await page.locator('#cinematicIntro').waitFor({state:'hidden'});
  async function upload(description){
   const before=uploads;await page.locator('#mediaInput').setInputFiles('data/uploaded_audio_references/upload1-02.wav');assert.equal(uploads,before,'selection does not upload');
   await page.locator('#description').fill(description);await page.locator('#sendButton').click();
   await page.locator('#busy').waitFor({state:'hidden'});await page.locator('.sound-result').last().waitFor();
   assert.equal(requests.at(-1).resultFormat,'compact');assert.equal(requests.at(-1).mediaAttachedThisTurn,true);
  }
  await upload('الفرامل تصفر عند الفرامل');
  assert.equal(await page.locator('.sound-result').count(),1);assert.equal(await page.locator('.sound-result-name').textContent(),'القماشات');
  assert.equal(await page.locator('.sound-result li').count(),2);assert.equal(await page.locator('.problem-summary').count(),0);assert.equal(await page.locator('.reference-example').count(),0);
  assert.doesNotMatch(await page.locator('.sound-result').textContent(),/Gemini|API|JSON|\d+%/);
  await page.locator('.sound-result summary').click();const audio=page.locator('.sound-result audio');await audio.evaluate(a=>a.play());await page.waitForFunction(()=>document.querySelector('.sound-result audio').currentTime>0.05);await audio.evaluate(a=>a.pause());
  await page.screenshot({path:artifacts+'/matched-ar-desktop.png',fullPage:true,animations:'disabled'});
  await page.reload();await page.locator('[data-intro=skip]').click();await page.locator('#cinematicIntro').waitFor({state:'hidden'});await page.locator('.history-row').first().click();await page.locator('.sound-result-name').waitFor();assert.equal(await page.locator('.sound-result-name').textContent(),'القماشات');
  await page.locator('#languageSwitch').click();await page.locator('#newCaseSide').click();mode='clear';await upload('My brakes squeal when braking');assert.equal(await page.locator('.sound-result-name').textContent(),'Brake pads');assert.ok(requests.at(-1).vehicleHistory.some(x=>x.description.includes('الفرامل')),'recent chat cases are retained as unverified history');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:artifacts+'/matched-en-mobile.png',fullPage:true,animations:'disabled'});
  // Reset to desktop so the new-case action is in the visible sidebar.
  await page.setViewportSize({width:1440,height:1000});
  for(const next of ['speech','music','silence','other','uncertain','partial','ambiguous','unknown','failure']){
   mode=next;await page.locator('#newCaseSide').click();await upload('I attached a recording for review');
   assert.equal(await page.locator('.sound-result').last().getAttribute('data-status'),'no_reliable_match',next);
   assert.equal(await page.locator('.sound-result-name').count(),0,next);assert.equal(await page.locator('.sound-result audio').count(),0,next);
   assert.equal(await page.locator('.sound-result li').count(),1,next);
  }
  mode='mixed';await page.locator('#newCaseSide').click();await upload('The brakes squeal when braking');assert.equal(await page.locator('.sound-result').last().getAttribute('data-status'),'possible_match');
  await page.locator('#languageSwitch').click();mode='uncertain';await page.locator('#newCaseSide').click();await upload('أرفقت مقطعًا للمراجعة');assert.match(await page.locator('.sound-result h3').textContent(),/لا يوجد تطابق موثوق/);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:artifacts+'/unmatched-ar-mobile.png',fullPage:true,animations:'disabled'});
  const safe=await page.evaluate(async()=>{const {renderSoundResult}=await import('/sound-result.js');const card=renderSoundResult({version:1,status:'possible_match',title:'Title',problem:'<img src=x onerror=alert(1)>',why:'<script>bad</script>',steps:['<b>step</b>'],sources:[{url:'javascript:alert(1)'}],reference:{id:'upload1-02',url:'https://evil.test/x'}},'en');return {images:card.querySelectorAll('img').length,scripts:card.querySelectorAll('script').length,links:card.querySelectorAll('a').length,audio:card.querySelectorAll('audio').length};});assert.deepEqual(safe,{images:0,scripts:0,links:0,audio:0});
  assert.deepEqual(errors,[]);console.log('PASS compact sound cards: actual HTTP card construction, Arabic/English, matching/mixed and no-match categories, partial/ambiguous/unknown/failure, real reference playback, history, safe DOM and 320–1440px. Audio inference mocked; no accuracy claim.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
