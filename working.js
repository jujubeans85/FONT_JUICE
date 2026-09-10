(()=>{
'use strict';
const BUILD_ID='2026-09-10-composer-1';
let DATA={};
const MODES={
  neat:{rot:1.1,base:.025,scale:.025,track:.045,space:.45,thick:0,line:1.32},
  chisel:{rot:1.8,base:.04,scale:.035,track:-.015,space:.40,thick:3,line:1.27},
  loose:{rot:4.2,base:.085,scale:.065,track:-.095,space:.34,thick:2,line:1.18}
};
const $=id=>document.getElementById(id);
const els={
  text:$('text'),mode:$('mode'),size:$('size'),sizeValue:$('sizeValue'),width:$('width'),seed:$('seed'),
  color:$('color'),bg:$('bg'),canvas:$('canvas'),status:$('status'),readyDot:$('readyDot'),
  dimensions:$('dimensions'),exportPanel:$('exportPanel'),exportPreview:$('exportPreview')
};
const imagePromises=new Map();
const STORAGE_KEY='font-juice-state-v2';
let renderSerial=0,debounceTimer=0,lastObjectUrl='',renderReady=false;
function rng(seed){let s=(Number(seed)||1)>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
function currentLine(lines){return lines[lines.length-1]}
// The original captures were all resized to the same height, including tiny marks.
// Restore ordinary punctuation proportions without changing their captured shapes.
const PUNCTUATION={'.':[.12,0],',':[.22,.10],':':[.48,-.16],';':[.58,.04],
  "'":[.24,-.69],'"':[.25,-.69],'-':[.10,-.42],'_':[.06,.08],'~':[.18,-.40],'^':[.24,-.62]};
function layoutItems(items,available){
  const lines=[[]];let used=0;
  const nextLine=()=>{while(currentLine(lines).at(-1)?.space)currentLine(lines).pop();lines.push([]);used=0};
  for(let i=0;i<items.length;){
    const item=items[i];
    if(item.newline){nextLine();i++;continue}
    if(item.space){if(used&&used+item.advance<=available){currentLine(lines).push(item);used+=item.advance}i++;continue}
    let end=i,total=0;
    while(end<items.length&&!items[end].space&&!items[end].newline)total+=items[end++].advance;
    if(used&&used+total>available)nextLine();
    for(;i<end;i++){
      if(used&&used+items[i].advance>available)nextLine();
      currentLine(lines).push(items[i]);used+=items[i].advance;
    }
  }
  return lines;
}
function normaliseText(value){
  return value.toUpperCase().replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/\u00a0/g,' ')
    .replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"')
    .replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...');
}
function textUnits(value){return Array.from(normaliseText(value))}
function exportEnabled(value){renderReady=value;$('saveBtn').disabled=!value;$('showBtn').disabled=!value}
function invalidateExport(){exportEnabled(false);els.exportPanel.hidden=true;els.exportPreview.removeAttribute('src')}

function setStatus(message,kind=''){els.status.textContent=message;els.readyDot.className='ready-dot'+(kind?' '+kind:'')}
function controlsDisabled(value){document.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=value)}
async function removeLegacyWorkers(){
  try{
    if('serviceWorker'in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.filter(r=>r.scope.includes('/FONT_JUICE/')).map(r=>r.unregister()));
    }
    if('caches'in globalThis){
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('font-juice-')).map(k=>caches.delete(k)));
    }
  }catch(error){console.warn(error)}
}
async function loadDataset(){
  DATA=globalThis.FONT_JUICE_GLYPHS;
  if(!DATA||typeof DATA!=='object')throw new Error('Handwriting data did not load. Reload while connected.');
  for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'){
    if(!Array.isArray(DATA[ch])||!DATA[ch].length)throw new Error(`Handwriting data is missing ${ch}`);
  }
  $('buildInfo').textContent=`Build ${BUILD_ID} · Adam Hand v1`;
}
function prepareGlyphMask(image){
  const mask=document.createElement('canvas');
  mask.width=image.naturalWidth||image.width;
  mask.height=image.naturalHeight||image.height;
  const ctx=mask.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('2D canvas unavailable');
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,mask.width,mask.height);
  const data=pixels.data;
  const count=mask.width*mask.height;
  if(!count)throw new Error('Zero-sized glyph');
  // Transparent sources already contain the correct mask, regardless of ink RGB.
  // Opaque scans use the border to identify white paper vs a black backing.
  let hasTransparency=false,borderLuminance=0,borderSamples=0;
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){
    const i=(y*mask.width+x)*4;
    if(data[i+3]<255)hasTransparency=true;
    if(x===0||y===0||x===mask.width-1||y===mask.height-1){
      borderLuminance+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];borderSamples++;
    }
  }
  const lightBackground=borderLuminance/Math.max(1,borderSamples)>127;
  let occupied=0,borderOccupied=0,borderCount=0;
  for(let y=0;y<mask.height;y++){
    for(let x=0;x<mask.width;x++){
      const i=(y*mask.width+x)*4;
      const luminance=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
      const alpha=hasTransparency?data[i+3]:Math.round(lightBackground?255-luminance:luminance);
      data[i]=255;data[i+1]=255;data[i+2]=255;data[i+3]=alpha;
      const border=x===0||y===0||x===mask.width-1||y===mask.height-1;
      if(border)borderCount++;
      if(alpha>12){occupied++;if(border)borderOccupied++}
    }
  }
  const coverage=occupied/count;
  const borderCoverage=borderCount?borderOccupied/borderCount:0;
  if(coverage<.001)throw new Error('Glyph mask is empty');
  if(coverage>.96&&borderCoverage>.9)throw new Error('Glyph mask became a solid rectangle');
  ctx.clearRect(0,0,mask.width,mask.height);
  ctx.putImageData(pixels,0,0);
  return mask;
}
function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{try{resolve(prepareGlyphMask(image))}catch(error){reject(error)}};
    image.onerror=()=>reject(new Error('A handwriting glyph could not load'));
    image.src=src;
  });
}
function getGlyphs(character){
  if(!DATA[character])return Promise.resolve([]);
  if(!imagePromises.has(character))imagePromises.set(character,Promise.all(DATA[character].map(loadImage)));
  return imagePromises.get(character);
}
function hasRoute(){const params=new URLSearchParams(location.search);return params.has('fish')||params.has('id')||params.has('slot')||params.has('tag')||params.has('nfc')}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({text:els.text.value,mode:els.mode.value,size:els.size.value,width:els.width.value,seed:els.seed.value,color:els.color.value,bg:els.bg.value}))}catch{}}
function restoreState(){
  try{
    if(hasRoute())throw new Error('route-owned state');
    const state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(state)for(const key of ['text','mode','size','width','seed','color','bg'])if(state[key]!==undefined&&els[key])els[key].value=state[key];
  }catch{}
  els.sizeValue.value=els.size.value;
}
async function render(){
  const serial=++renderSerial;
  invalidateExport();
  const value=normaliseText(els.text.value);
  const missing=[...new Set(textUnits(value).filter(ch=>!DATA[ch]&&!/\s/.test(ch)))];
  const needed=[...new Set(textUnits(value).filter(ch=>DATA[ch]))];
  setStatus(needed.length?'Loading the letters used here…':'Type something to render.');
  try{
    const pairs=await Promise.all(needed.map(async ch=>[ch,await getGlyphs(ch)]));
    if(serial!==renderSerial)return;
    const images=Object.fromEntries(pairs);
    const canvas=els.canvas;
    const mode=MODES[els.mode.value]||MODES.chisel;
    const size=Math.min(190,Math.max(50,Number(els.size.value)||100));
    const width=Math.min(4096,Math.max(320,Number(els.width.value)||1600));
    const seed=Number(els.seed.value)||1;
    const random=rng(seed);
    const margin=Math.max(24,Math.round(size*.44));
    const lineHeight=size*mode.line;
    const items=[];
    const available=width-margin*2;
    let x=margin;
    const previousVariant={};
    for(const ch of textUnits(value)){
      if(ch==='\n'){items.push({newline:true});continue}
      if(ch===' '){
        const advance=size*mode.space;
        items.push({space:true,advance});
        continue;
      }
      const variants=images[ch];
      if(!variants||!variants.length)continue;
      let variant=Math.floor(random()*variants.length);
      if(previousVariant[ch]===variant&&variants.length>1)variant=(variant+1)%variants.length;
      previousVariant[ch]=variant;
      const image=variants[variant];
      const [heightFactor,baselineOffset]=PUNCTUATION[ch]||[1,0];
      const scale=Math.min((size*heightFactor/image.height)*(1+(random()*2-1)*mode.scale),Math.max(1,available-12)/image.width);
      const itemWidth=image.width*scale,itemHeight=image.height*scale;
      const advance=Math.max(size*.12,itemWidth+size*mode.track);
      items.push({image,itemWidth,itemHeight,advance,rotation:(random()*2-1)*mode.rot,baseline:baselineOffset*size+(random()*2-1)*mode.base*size});
    }
    const lines=layoutItems(items,available);
    const height=Math.max(180,Math.ceil(margin*2+lines.length*lineHeight));
    if(height>8192||height*width>16000000)throw new Error('Too much text for one image. Reduce letter size or split your message.');
    canvas.width=width;
    canvas.height=height;
    const context=canvas.getContext('2d',{alpha:false});
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.fillStyle=els.bg.value;
    context.fillRect(0,0,canvas.width,canvas.height);
    let y=margin+.88*lineHeight;
    for(const line of lines){
      x=margin;
      for(const item of line){
        if(item.space){x+=item.advance;continue}
        const offscreen=document.createElement('canvas');
        offscreen.width=Math.ceil(item.itemWidth+24);
        offscreen.height=Math.ceil(item.itemHeight+24);
        const off=offscreen.getContext('2d');
        off.drawImage(item.image,12,12,item.itemWidth,item.itemHeight);
        off.globalCompositeOperation='source-in';
        off.fillStyle=els.color.value;
        off.fillRect(0,0,offscreen.width,offscreen.height);
        context.save();
        context.translate(x+item.itemWidth/2,y-item.itemHeight/2+item.baseline);
        context.rotate(item.rotation*Math.PI/180);
        if(mode.thick){for(let dx=-mode.thick;dx<=mode.thick;dx+=2)for(let dy=-Math.ceil(mode.thick/2);dy<=Math.ceil(mode.thick/2);dy+=2)context.drawImage(offscreen,-item.itemWidth/2+dx-12,-item.itemHeight/2+dy-12)}
        context.drawImage(offscreen,-item.itemWidth/2-12,-item.itemHeight/2-12);
        context.restore();
        x+=item.advance;
      }
      y+=lineHeight;
    }
    els.dimensions.textContent=`${canvas.width} × ${canvas.height}px`;
    const hasInk=lines.some(line=>line.some(item=>!item.space));
    exportEnabled(hasInk);
    if(!value.trim())setStatus('Type something to render.');
    else if(missing.length)setStatus(`Rendered. No captured character for: ${missing.join(' ')}.`,hasInk?'':'err');
    else setStatus(`Ready — seed ${seed}.`,'ok');
    saveState();
  }catch(error){if(serial!==renderSerial)return;console.error(error);exportEnabled(false);setStatus(`Render failed: ${error.message}`,'err')}
}
function scheduleRender(){++renderSerial;invalidateExport();clearTimeout(debounceTimer);debounceTimer=setTimeout(render,130)}
function revealPng(dataUrl){els.exportPreview.src=dataUrl;els.exportPanel.hidden=false;els.exportPanel.scrollIntoView({behavior:'smooth',block:'nearest'})}
function dataUrlToBlob(dataUrl){const parts=dataUrl.split(',');const mime=(parts[0].match(/:(.*?);/)||[])[1]||'image/png';const binary=atob(parts[1]);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:mime})}
function currentPng(){if(!renderReady)return null;const dataUrl=els.canvas.toDataURL('image/png');revealPng(dataUrl);return dataUrl}
function downloadBlob(blob,filename){if(lastObjectUrl)URL.revokeObjectURL(lastObjectUrl);lastObjectUrl=URL.createObjectURL(blob);const link=document.createElement('a');link.href=lastObjectUrl;link.download=filename;link.rel='noopener';document.body.appendChild(link);link.click();link.remove();setStatus('PNG prepared. If iOS ignores it, long-press the image below.','ok')}
function saveOrShare(){
  const dataUrl=currentPng();
  if(!dataUrl)return;
  const filename=`adam-hand-${Date.now()}.png`;
  const blob=dataUrlToBlob(dataUrl);
  if(typeof File!=='undefined'&&navigator.share){
    const file=new File([blob],filename,{type:'image/png'});
    const shareData={files:[file],title:'Adam Hand PNG'};
    if(!navigator.canShare||navigator.canShare(shareData)){
      navigator.share(shareData).then(()=>setStatus('PNG shared or saved.','ok')).catch(error=>{if(error&&error.name!=='AbortError')downloadBlob(blob,filename)});
      return;
    }
  }
  downloadBlob(blob,filename);
}
function bind(){
  $('renderBtn').addEventListener('click',render);
  $('shuffleBtn').addEventListener('click',()=>{els.seed.value=String((Date.now()%1000000)||1);render()});
  $('saveBtn').addEventListener('click',saveOrShare);
  $('showBtn').addEventListener('click',()=>{if(currentPng())setStatus('PNG shown below. Long-press it to save.','ok')});
  $('clearBtn').addEventListener('click',()=>{els.text.value='';els.text.focus();scheduleRender()});
  $('installHelpBtn').addEventListener('click',()=>$('installDialog').showModal());
  for(const id of ['text','mode','size','width','seed','color','bg']){
    const element=els[id];
    element.addEventListener(id==='text'?'input':'change',scheduleRender);
    if(['size','color','bg'].includes(id))element.addEventListener('input',scheduleRender);
  }
  els.size.addEventListener('input',()=>{els.sizeValue.value=els.size.value});
  window.addEventListener('beforeunload',()=>{if(lastObjectUrl)URL.revokeObjectURL(lastObjectUrl)});
}
async function start(){
  removeLegacyWorkers();
  restoreState();
  bind();
  controlsDisabled(true);
  setStatus('Loading handwriting dataset…');
  try{
    await loadDataset();
    controlsDisabled(false);
    await render();
  }catch(error){console.error(error);controlsDisabled(false);exportEnabled(false);setStatus(`Start failed: ${error.message}`,'err')}
}
start();
})();
