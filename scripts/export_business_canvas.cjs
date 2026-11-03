// Documentation export only; uses environment-installed Playwright/Chromium.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const directory=path.resolve(__dirname,'../docs/business');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:2000,height:1415},deviceScaleFactor:2});
  await page.setContent(fs.readFileSync(path.join(directory,'business-model-canvas-ar.html'),'utf8'),{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.canvas>.cell').count(),9);
  const overflow=await page.locator('.cell').evaluateAll(nodes=>nodes.filter(n=>n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1).map(n=>n.className));
  assert.deepEqual(overflow,[],'Canvas content must fit its nine panels');
  await page.locator('.sheet').screenshot({path:path.join(directory,'business-model-canvas-ar.png')});
  await page.pdf({path:path.join(directory,'business-model-canvas-ar.pdf'),format:'A3',landscape:true,printBackground:true,preferCSSPageSize:true,margin:{top:0,right:0,bottom:0,left:0}});
  console.log('Exported Arabic nine-block canvas as PNG and A3 PDF; panel overflow checks passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
