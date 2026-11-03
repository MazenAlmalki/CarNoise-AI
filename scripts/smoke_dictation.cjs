// Real Chromium microphone/DOM/storage. ASR and inference responses are MOCKS.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 try{
  const context=await browser.newContext({permissions:['microphone'],viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
   localStorage.setItem('carnoise-garage-v2',JSON.stringify({cars:[{id:'a',name:'Camry 2018'},{id:'b',name:'Corolla 2021'}],cases:[],carId:'a',lang:'ar',theme:'dark'}));
   window.__tracks=[];const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
   navigator.mediaDevices.getUserMedia=async c=>{const stream=await original(c);window.__tracks.push(...stream.getTracks());return stream;};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let asrCalls=0,mediaCalls=0,chatCalls=0,mode='hold',release=null;
  await page.route('**/api/speech/status',r=>r.fulfill({json:{configured:false}}));
  await page.route('**/api/speech/transcribe',async r=>{
   asrCalls++;const current=mode;
   if(current==='hold')await new Promise(resolve=>release=resolve);
   try {await r.fulfill(current==='error'?{status:503,json:{error:'ASR unavailable'}}:{json:{transcription:{hasRecognizedSpeech:current!=='silence',text:current==='silence'?'':current==='english'?'Hello, please review this draft':'السلام عليكم'}}});}catch{}
  });
  await page.route('**/api/media/analyze',r=>{mediaCalls++;return r.fulfill({json:{analysis:{type:'audio',audioContent:{type:'uncertain',status:'unavailable'},waveform:{kind:'waveform_features_only'}}}});});
  await page.route('**/api/chat',r=>{chatCalls++;return r.fulfill({json:{reply:'وعليكم السلام، كيف أساعدك؟',responseLanguage:'ar'}});});
  await page.goto(process.env.SMOKE_URL||'http://127.0.0.1:3007');
  await page.locator('[data-intro=skip]').click();await page.locator('#cinematicIntro').waitFor({state:'hidden'});
  const draft=page.locator('#description');
  async function record(){await page.locator('#recordButton').click();await page.waitForFunction(()=>document.body.dataset.assistantState==='recording');await page.waitForTimeout(200);await page.locator('#recordButton').click();}
  await draft.fill('وصف مكتوب');await record();await page.waitForFunction(()=>document.querySelector('#dictationNotice').textContent.includes('جاري'));
  await draft.fill('وصف عدلته أثناء الانتظار');release();
  await page.waitForFunction(()=>document.querySelector('#description').value.includes('السلام عليكم'));
  assert.equal(await draft.inputValue(),'وصف عدلته أثناء الانتظار\nالسلام عليكم');
  assert.equal(chatCalls,0);assert.equal(mediaCalls,0);
  let garage=await page.evaluate(()=>JSON.parse(localStorage.getItem('carnoise-garage-v2')));assert.equal(garage.cases.length,0);
  assert.equal(await page.locator('#mediaPreview audio').count(),0);
  assert.equal(await page.evaluate(()=>window.__tracks.every(t=>t.readyState==='ended')),true);
  await draft.press('Shift+Enter');assert.equal(chatCalls,0);
  await draft.fill('السلام عليكم');await draft.press('Enter');await page.locator('.message.assistant').waitFor();assert.equal(chatCalls,1);
  garage=await page.evaluate(()=>JSON.parse(localStorage.getItem('carnoise-garage-v2')));assert.equal(garage.cases[0].mediaId??null,null);
  // Cancellation rejects late ASR results without modifying a newer draft.
  mode='hold';await draft.fill('مسودة محفوظة');const before=asrCalls;await record();await page.waitForFunction(()=>document.querySelector('#dictationNotice').textContent.includes('جاري'));assert.equal(asrCalls,before+1);
  await page.locator('#cancelDictation').click();await draft.fill('مسودة بعد الإلغاء');release();await page.waitForTimeout(250);assert.equal(await draft.inputValue(),'مسودة بعد الإلغاء');
  // Explicit cancel while recording releases tracks and never starts ASR.
  await page.locator('#recordButton').click();await page.waitForFunction(()=>document.body.dataset.assistantState==='recording');
  const count=asrCalls;await page.locator('#cancelDictation').click();await page.waitForTimeout(200);assert.equal(asrCalls,count);
  // Silence/failure preserve text without manufacturing a message or media.
  for(const current of ['silence','error']){mode=current;await draft.fill('احفظ هذا الوصف');await record();await page.locator('#errorBox:not(.hidden)').waitFor();assert.equal(await draft.inputValue(),'احفظ هذا الوصف');assert.equal(chatCalls,1);assert.equal(mediaCalls,0);}
  // Navigation during ASR discards a late result.
  mode='hold';await record();await page.waitForFunction(()=>document.querySelector('#dictationNotice').textContent.includes('جاري'));
  await page.locator('#menuButton').click();await page.locator('#vehicleSelect').selectOption('b');release();await page.waitForTimeout(250);assert.equal(await draft.inputValue(),'');
  assert.equal(await page.evaluate(()=>window.__tracks.every(t=>t.readyState==='ended')),true);
  // Attachments use media analysis only after explicit Send.
  await page.locator('#mediaInput').setInputFiles('data/uploaded_audio_references/upload1-01.wav');assert.equal(mediaCalls,0);
  await draft.fill('هذا مقطع مرفق وليس إملاء');await page.locator('#sendButton').click();await page.locator('.message.assistant').waitFor();assert.equal(mediaCalls,1);assert.equal(chatCalls,2);
  await page.locator('#languageSwitch').click();assert.equal(await page.locator('#recordButton span').textContent(),'Dictate');
  mode='english';await draft.fill('Written details');await record();await page.waitForFunction(()=>document.querySelector('#description').value.includes('Hello, please review'));assert.equal(await draft.inputValue(),'Written details\nHello, please review this draft');assert.equal(chatCalls,2);
  await draft.fill('x'.repeat(2000));await record();await page.locator('#dictationOverflow:not(.hidden)').waitFor();assert.equal((await draft.inputValue()).length,2000);assert.match(await page.locator('#dictationOverflow').inputValue(),/Hello/);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  assert.deepEqual(errors,[]);console.log('PASS dictation: real microphone cleanup, draft review and edits, no auto-send/media, Enter/Shift+Enter, cancellation, stale navigation, silence/errors, explicit attachment Send and responsive UI. ASR/provider mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
