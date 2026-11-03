// Real elapsed presentation time. First upload uses actual media/HTTP recognition;
// later ordinary/safety replies are mocked to isolate UI timing.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const file=process.argv[2];if(!file)throw Error('Supply one registered original MP4 path.');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>localStorage.setItem('warshatak-voice',JSON.stringify({auto:false})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let mode='real';
  await page.route('**/api/speech/status',r=>r.fulfill({json:{configured:false}}));
  await page.route('**/api/chat',r=>mode==='real'?r.continue():r.fulfill({json:mode==='urgent'?{reply:'Stop safely and get help.',responseLanguage:'en',problemSummary:{urgent:true,assessment:'Safety warning',nextStep:'Stop safely'}}:{reply:'Ordinary reply.',responseLanguage:'en',problemSummary:null}}));
  await page.goto(process.env.SMOKE_URL||'http://127.0.0.1:3010');await page.locator('[data-intro=skip]').click();await page.locator('#cinematicIntro').waitFor({state:'hidden'});
  async function upload(){await page.locator('#mediaInput').setInputFiles(file);await page.locator('#description').fill('حلل المرفق');await page.locator('#sendButton').click();}
  const sent=Date.now();await upload();
  await page.waitForFunction(()=>/Preparing your result|جاري تجهيز النتيجة/.test(document.querySelector('#typingLabel').textContent));
  assert.equal(await page.locator('.sound-result').count(),0,'result is held during the presentation pause');
  await page.locator('.sound-result').waitFor({timeout:40000});
  assert.ok(Date.now()-sent>=29500,'attachments wait about thirty seconds from Send');
  assert.equal(await page.locator('.sound-result').getAttribute('data-status'),'known_recording');
  await page.locator('#busy').waitFor({state:'hidden'});
  mode='ordinary';const ordinaryAt=Date.now();await page.locator('#description').fill('Explain that briefly');await page.locator('#sendButton').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.message.assistant')].some(n=>n.textContent.includes('Ordinary reply.')),{},{timeout:10000});
  assert.ok(Date.now()-ordinaryAt>=4800);assert.ok(Date.now()-ordinaryAt<10000,'ordinary text does not receive attachment pacing');
  await page.locator('#busy').waitFor({state:'hidden'});
  await page.locator('#newCaseSide').click();mode='real';await upload();await page.waitForFunction(()=>/Preparing your result|جاري تجهيز النتيجة/.test(document.querySelector('#typingLabel').textContent));
  await page.locator('#cancelRequest').click();await page.locator('#busy').waitFor({state:'hidden'});assert.equal(await page.locator('.message.assistant').count(),0);
  await page.locator('#newCaseSide').click();mode='urgent';const urgentAt=Date.now();await upload();
  await page.waitForFunction(()=>[...document.querySelectorAll('.message.assistant')].some(n=>n.textContent.includes('Stop safely and get help.')),{},{timeout:5000});
  assert.ok(Date.now()-urgentAt<5000,'urgent attachments bypass thirty-second pacing');
  assert.deepEqual(errors,[]);console.log('PASS attachment presentation: actual known upload held for 30 seconds, ordinary text retains 5 seconds, cancellation drops stale output and urgent replies bypass delay. Timing is presentation, not inference.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
