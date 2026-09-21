const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createCanvas}=require('@napi-rs/canvas');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.FONT_JUICE_TEST_URL||'http://127.0.0.1:8765');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready'));
 const pixel=()=>page.evaluate(()=>Array.from(document.querySelector('#canvas').getContext('2d').getImageData(0,0,1,1).data));
 const ready=()=>page.waitForFunction(()=>!document.querySelector('#saveBtn').disabled);
 for(let i=0;i<6;i++){
  const c=createCanvas(20,20);const ctx=c.getContext('2d');ctx.fillStyle=`rgb(${20+i*30},40,60)`;ctx.fillRect(0,0,20,20);
  await page.selectOption('#backgroundSlot',String(i));
  await page.setInputFiles('#backgroundFile',{name:`art-${i}.png`,mimeType:'image/png',buffer:c.toBuffer('image/png')});
  await page.waitForFunction(i=>document.querySelector('#backgroundSlot').options[i+1].textContent.includes(`art-${i}`),i);
  await ready();assert.deepEqual(await pixel(),[20+i*30,40,60,255]);
 }
 await page.click('#backgroundNext');await ready();assert.deepEqual(await pixel(),[20,40,60,255]);
 await page.click('#backgroundPrev');await ready();assert.deepEqual(await pixel(),[170,40,60,255]);
 await page.reload();await ready();assert.equal(await page.inputValue('#backgroundSlot'),'5');assert.deepEqual(await pixel(),[170,40,60,255]);
 await page.check('#transparent');await ready();assert.equal((await pixel())[3],0);
 await page.click('#showBtn');assert.match(await page.getAttribute('#exportPreview','src'),/^data:image\/png/);
 await page.uncheck('#transparent');await ready();assert.deepEqual(await pixel(),[170,40,60,255]);
 await page.selectOption('#backgroundSlot','-1');await ready();assert.deepEqual(await pixel(),[255,255,255,255]);
 await page.selectOption('#backgroundSlot','5');await ready();
 await page.setInputFiles('#backgroundFile',{name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid')});
 await page.waitForFunction(()=>document.querySelector('#backgroundStatus').textContent.startsWith('Image not replaced'));
 assert.deepEqual(await pixel(),[170,40,60,255]);
 await page.click('#backgroundRemove');await page.waitForFunction(()=>document.querySelector('#backgroundStatus').textContent==='Slot cleared.');await ready();
 await page.reload();await ready();assert.match(await page.locator('#backgroundSlot option').nth(6).textContent(),/Empty/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile layout fits');
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'/workspace/scratch/c968c70dc250/background-check.png',fullPage:true});
 await browser.close();console.log('PASS: six uploads, wrap both directions, reload persistence, transparent PNG, plain colour, invalid image retention, delete persistence, mobile width, no browser errors.');
})().catch(e=>{console.error(e);process.exit(1)});
