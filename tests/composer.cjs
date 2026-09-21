// Regression checks run the real composer against a native canvas, without a browser.
// NODE_PATH must expose the @napi-rs/canvas package in the test environment.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createCanvas,Image,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
const pngDir=process.env.FONT_JUICE_TEST_OUTPUT;
function element(value=''){
 return {value,disabled:false,hidden:false,textContent:'',className:'',listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn},removeAttribute(name){delete this[name]},
  scrollIntoView(){},focus(){},showModal(){},remove(){},click(){this.listeners.click?.()}};
}
const defaults={dataset:'original',text:'MADE WITH LOVE.\nA LITTLE WONKY. ALL ME.',mode:'neat',size:'100',width:'1600',seed:'21',color:'#000000',bg:'#ffffff'};
const elements=Object.fromEntries(['dataset','textHelp','text','mode','size','sizeValue','width','seed','color','bg','transparent','status','readyDot','dimensions','exportPanel','exportPreview','buildInfo','renderBtn','shuffleBtn','saveBtn','showBtn','clearBtn','installHelpBtn','installDialog'].map(k=>[k,element(defaults[k]||'')]));
elements.canvas=createCanvas(300,150);
const storage=new Map();
const errors=[];
const sandbox={console:{log:console.log,warn(){},error(e){errors.push(e.message)}},URL,URLSearchParams,Image,Blob,File,atob,Uint8Array,setTimeout,clearTimeout,
 document:{getElementById:id=>elements[id],querySelectorAll:()=>Object.values(elements).filter(e=>e.listeners),createElement:tag=>tag==='canvas'?createCanvas(1,1):element(),body:{appendChild(){}}},
 navigator:{},location:{search:'?mask=7',href:'https://example.test/FONT_JUICE/?mask=7'},
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},window:{addEventListener(){}},
 fetch(){throw new Error('Unexpected network dependency')}};
vm.createContext(sandbox);
const datasetName=fs.readdirSync(path.join(root,'data')).find(n=>/^adam-hand-v1\..*\.js$/.test(n));
vm.runInContext(fs.readFileSync(path.join(root,'data',datasetName),'utf8'),sandbox);
const captureName=fs.readdirSync(path.join(root,'data')).find(n=>/^adam-hand-capture03\..*\.js$/.test(n));
vm.runInContext(fs.readFileSync(path.join(root,'data',captureName),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'composition.js'),'utf8'),sandbox);
const source=fs.readFileSync(path.join(root,'working.js'),'utf8').replace('start();\n})();','globalThis.testApi={prepareGlyphMask,getGlyphs,render,loadDataset,normaliseText,scheduleRender,currentPng,layoutItems,restoreState};\n})();');
vm.runInContext(source,sandbox);
const api=sandbox.testApi;
function coverage(canvas){const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let count=0;for(let i=3;i<d.length;i+=4)if(d[i]>12)count++;return count/(d.length/4)}
function composition(){return elements.canvas.toBuffer('image/png')}
function colourCount(rgb){const d=elements.canvas.getContext('2d').getImageData(0,0,elements.canvas.width,elements.canvas.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(rgb.every((v,j)=>Math.abs(v-d[i+j])<5))n++;return n}
async function run(){
 await api.loadDataset();
 const wrapped=api.layoutItems([{advance:40},{space:true,advance:10},{advance:30},{advance:30}],100);
 assert.equal(wrapped.length,2);assert.equal(wrapped[0].length,1);assert.equal(wrapped[1].length,2,'normal words stay together');
 // All combinations that caused the earlier alpha/luminance failure.
 for(const transparent of [true,false])for(const whiteInk of [true,false]){
  const raw=createCanvas(20,20),ctx=raw.getContext('2d');
  if(!transparent){ctx.fillStyle=whiteInk?'black':'white';ctx.fillRect(0,0,20,20)}
  ctx.fillStyle=whiteInk?'white':'black';ctx.fillRect(6,3,3,14);ctx.fillRect(6,14,9,3);
  const result=api.prepareGlyphMask(raw);
  assert(coverage(result)>.1&&coverage(result)<.3,'background must remain transparent');
  assert.equal(result.getContext('2d').getImageData(7,5,1,1).data[3],255,'stroke retained');
 }
 const blank=createCanvas(20,20);assert.throws(()=>api.prepareGlyphMask(blank),/empty/);
 let variants=0;
 for(const ch of Object.keys(sandbox.FONT_JUICE_GLYPHS)){
  const masks=await api.getGlyphs(ch);assert.equal(masks.length,4);
  for(const m of masks){const ratio=coverage(m);assert(ratio>.001&&ratio<.96,`${ch} has a visible irregular mask`);variants++}
 }
 assert.equal(variants,268);
 await api.render();
 assert.match(elements.status.textContent,/Ready/);assert.equal(elements.saveBtn.disabled,false);
 assert(colourCount([0,0,0])>1000,'actual dark strokes rendered');
 assert(colourCount([255,255,255])>elements.canvas.width*elements.canvas.height*.5,'background remains open');
 elements.transparent.checked=true;await api.render();
 assert.equal(elements.canvas.getContext('2d').getImageData(0,0,1,1).data[3],0);
 assert(coverage(elements.canvas)>.01&&coverage(elements.canvas)<.5,'transparent canvas retains ink');
 const transparentImage=await loadImage(api.currentPng());
 const roundtrip=createCanvas(transparentImage.width,transparentImage.height);
 roundtrip.getContext('2d').drawImage(transparentImage,0,0);
 assert.equal(roundtrip.getContext('2d').getImageData(0,0,1,1).data[3],0,'exported PNG has transparent margins');
 elements.transparent.checked=false;api.restoreState();assert.equal(elements.transparent.checked,true,'transparency persists');
 elements.transparent.checked=false;await api.render();
 assert.equal(elements.canvas.getContext('2d').getImageData(0,0,1,1).data[3],255,'solid background restored');
 const first=composition();await api.render();assert(first.equals(composition()),'seed is repeatable');
 if(pngDir){fs.mkdirSync(pngDir,{recursive:true});fs.writeFileSync(path.join(pngDir,'neat.png'),first)}
 elements.mode.value='chisel';await api.render();const chisel=composition();assert(!first.equals(chisel),'chisel differs');
 elements.mode.value='loose';await api.render();assert(!chisel.equals(composition()),'loose differs');
 elements.seed.value='42';await api.render();const seed42=composition();elements.seed.value='43';await api.render();assert(!seed42.equals(composition()),'new seed changes variants');
 elements.color.value='#cc0000';elements.bg.value='#e0e0ff';await api.render();assert(colourCount([204,0,0])>1000);assert(colourCount([224,224,255])>1000);
 elements.text.value='Hello, “Ma”… It’s me—Adam. ☮';elements.mode.value='neat';await api.render();assert.match(elements.status.textContent,/☮/);assert.equal(api.normaliseText('“Ma”—it’s…'),'"MA"-IT\'S...');
 const dataUrl=api.currentPng();assert(dataUrl.startsWith('data:image/png;base64,'));const decoded=await loadImage(dataUrl);assert.equal(decoded.width,1600);
 api.scheduleRender();assert.equal(elements.saveBtn.disabled,true);assert.equal(api.currentPng(),null,'cannot export previous text after an edit');
 elements.text.value='';await api.render();assert.equal(elements.saveBtn.disabled,true);assert.match(elements.status.textContent,/Type something/);
 elements.text.value='A\n'.repeat(100);await api.render();assert.match(elements.status.textContent,/Too much text/);assert.equal(elements.saveBtn.disabled,true);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const route=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 for(const [query,expected] of [['?mask=7',null],['',null],['?fish=test&set=21_v2','mimi21/?fish=test&set=21_v2'],['?slot=03','mimi21/?slot=03'],['?nfc=04','mimi21/?nfc=04&slot=04']]){
  let dest=null;vm.runInNewContext(route,{URL,URLSearchParams,location:{search:query,hash:'#keep',href:'https://example.test/FONT_JUICE/'+query,replace(v){dest=v}}});
  if(expected)assert.equal(dest,'https://example.test/FONT_JUICE/'+expected+'#keep');else assert.equal(dest,null);
 }
 const alias=fs.readFileSync(path.join(root,'working.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const retired=[];let aliasDestination=null;
 await vm.runInNewContext(alias,{URL,console,document:{getElementById:()=>({})},
  location:{search:'?mask=7',hash:'#keep',href:'https://example.test/FONT_JUICE/working.html?mask=7',replace(v){aliasDestination=v}},
  navigator:{serviceWorker:{getRegistrations:async()=>[
   {scope:'https://example.test/FONT_JUICE/',unregister:async()=>retired.push('font')},
   {scope:'https://example.test/other/',unregister:async()=>retired.push('other')}]}},
  caches:{keys:async()=>['font-juice-route-v9','unrelated-cache'],delete:async name=>retired.push(name)}});
 assert.equal(aliasDestination,'https://example.test/FONT_JUICE/?mask=7#keep');
 assert.deepEqual(retired,['font','font-juice-route-v9'],'retire only Font Juice before redirecting');
 for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^\"]*)?"/g)){
  const target=match[1];if(!target.startsWith('http'))assert(fs.existsSync(path.join(root,target)),`missing asset: ${target}`);
 }
 assert(fs.existsSync(path.join(root,'.nojekyll')),'plain static publishing must bypass Liquid');
 assert(!html.includes('mimi-21-router.js'),'birthday debug overlay must not run in composer');
 assert(!source.includes("fetch("),'dataset is independent of legacy HTML');
 // Switch datasets and verify original captures were not mixed with the new ones.
 elements.dataset.value='capture-03';elements.text.value='DEAR ME,\nJUST ENJOY YOUR TIME!';
 elements.mode.value='untucked';elements.color.value='#fd9613';elements.bg.value='#ffffff';elements.seed.value='21';
 await api.render();assert.match(elements.buildInfo.textContent,/Orange chisel/);
 let freshCount=0;
 for(const ch of Object.keys(sandbox.FONT_JUICE_CAPTURE03.glyphs)){
  const masks=await api.getGlyphs(ch);assert.equal(masks.length,(ch==='9'||ch==='\\')?3:4);
  for(const mask of masks){assert(coverage(mask)>.001&&coverage(mask)<.96);freshCount++}
 }
 assert.equal(freshCount,266);
 const newRender=composition();await api.render();assert(newRender.equals(composition()),'new set repeatable');
 assert(colourCount([253,150,19])>1000,'orange ink visible');
 if(pngDir)fs.writeFileSync(path.join(pngDir,'FONT_JUICE_Untucked_Preview.png'),newRender);
 elements.text.value='A.';await api.render();const fullstop=await api.getGlyphs('.'),letterA=await api.getGlyphs('A');
 assert(fullstop.every(m=>m.height<letterA[0].height*.4),'punctuation keeps its smaller captured size');
 const caption=JSON.parse(storage.get('font-juice-state-v2'));assert.equal(caption.dataset,'capture-03');
 elements.dataset.value='original';await api.render();assert.match(elements.buildInfo.textContent,/Original captures/);
 assert.equal((await api.getGlyphs('9')).length,4,'old captures still intact after switching');
 console.log('PASS: new capture 266 real masks, measured punctuation, dataset switching, orange ink, PNG output; original 268 masks.');
 console.log('PASS: 268 real masks; opaque/transparent mask inputs; deterministic render; 3 modes; seed shuffle; colours; multiline; PNG encode/decode; stale-export protection; size limit; composer/NFC routing; local assets.');
 console.log('Expected rejected render:',errors);
}
run().catch(e=>{console.error(e);process.exitCode=1});
