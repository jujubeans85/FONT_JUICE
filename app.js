(()=>{
'use strict';
const DATA=globalThis.FONT_JUICE_GLYPHS||{};
const MODES={
  neat:{rot:1.1,base:.025,scale:.025,track:.045,space:.45,thick:0,line:1.32},
  chisel:{rot:1.8,base:.04,scale:.035,track:-.015,space:.40,thick:3,line:1.27},
  loose:{rot:4.2,base:.085,scale:.065,track:-.095,space:.34,thick:2,line:1.18}
};
const $=id=>document.getElementById(id);
const els={text:$('text'),mode:$('mode'),size:$('size'),sizeValue:$('sizeValue'),width:$('width'),seed:$('seed'),color:$('color'),bg:$('bg'),canvas:$('canvas'),status:$('status'),readyDot:$('readyDot'),dimensions:$('dimensions'),exportPanel:$('exportPanel'),exportPreview:$('exportPreview')};
const imagePromises=new Map();
let renderSerial=0;
let debounceTimer=0;
let lastObjectUrl='';
const STORAGE_KEY='font-juice-state-v1';

function rng(seed){let s=(Number(seed)||1)>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
function currentLine(lines){return lines[lines.length-1]}
function setStatus(message,kind=''){
  els.status.textContent=message;
  els.readyDot.className='ready-dot'+(kind?' '+kind:'');
}
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('A handwriting glyph could not load'));image.src=src})}
function getGlyphs(character){
  if(!DATA[character])return Promise.resolve([]);
  if(!imagePromises.has(character))imagePromises.set(character,Promise.all(DATA[character].map(loadImage)));
  return imagePromises.get(character);
}
function textUnits(value){return Array.from(value.toUpperCase())}
function controlsDisabled(value){document.querySelectorAll('button').forEach(button=>button.disabled=value)}
function saveState(){
  const state={text:els.text.value,mode:els.mode.value,size:els.size.value,width:els.width.value,seed:els.seed.value,color:els.color.value,bg:els.bg.value};
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_error){}
}
function restoreState(){
  try{
    const state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!state)return;
    for(const key of ['text','mode','size','width','seed','color','bg'])if(state[key]!==undefined&&els[key])els[key].value=state[key];
  }catch(_error){}
  els.sizeValue.value=els.size.value;
}
async function render(){
  const serial=++renderSerial;
  const value=els.text.value.toUpperCase();
  const needed=[...new Set(textUnits(value).filter(ch=>DATA[ch]))];
  setStatus(needed.length?'Loading the letters used here…':'Type something to render.');
  try{
    const pairs=await Promise.all(needed.map(async ch=>[ch,await getGlyphs(ch)]));
    if(serial!==renderSerial)return false;
    const images=Object.fromEntries(pairs);
    const canvas=els.canvas;
    const mode=MODES[els.mode.value]||MODES.chisel;
    const size=Math.max(24,Number(els.size.value)||125);
    const width=Math.min(4096,Math.max(320,Number(els.width.value)||1600));
    const seed=Number(els.seed.value)||1;
    const random=rng(seed);
    const margin=Math.max(24,Math.round(size*.44));
    const lineHeight=size*mode.line;
    const lines=[[]];
    let x=margin;
    const previousVariant={};
    for(const ch of textUnits(value)){
      if(ch==='\n'){lines.push([]);x=margin;continue}
      if(ch===' '){
        const advance=size*mode.space;
        if(x+advance>width-margin&&currentLine(lines).length){lines.push([]);x=margin}
        else{currentLine(lines).push({space:true,advance});x+=advance}
        continue;
      }
      const variants=images[ch];
      if(!variants||!variants.length)continue;
      let variant=Math.floor(random()*variants.length);
      if(previousVariant[ch]===variant&&variants.length>1)variant=(variant+1)%variants.length;
      previousVariant[ch]=variant;
      const image=variants[variant];
      const scale=(size/image.height)*(1+(random()*2-1)*mode.scale);
      const itemWidth=image.width*scale;
      const itemHeight=image.height*scale;
      const advance=Math.max(size*.12,itemWidth+size*mode.track);
      if(x+advance>width-margin&&currentLine(lines).length){lines.push([]);x=margin}
      currentLine(lines).push({image,itemWidth,itemHeight,advance,rotation:(random()*2-1)*mode.rot,baseline:(random()*2-1)*mode.base*size});
      x+=advance;
    }
    canvas.width=width;
    canvas.height=Math.max(180,Math.ceil(margin*2+lines.length*lineHeight));
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
        const offContext=offscreen.getContext('2d');
        offContext.drawImage(item.image,12,12,item.itemWidth,item.itemHeight);
        offContext.globalCompositeOperation='source-in';
        offContext.fillStyle=els.color.value;
        offContext.fillRect(0,0,offscreen.width,offscreen.height);
        context.save();
        context.translate(x+item.itemWidth/2,y-item.itemHeight/2+item.baseline);
        context.rotate(item.rotation*Math.PI/180);
        if(mode.thick){
          for(let dx=-mode.thick;dx<=mode.thick;dx+=2){
            for(let dy=-Math.ceil(mode.thick/2);dy<=Math.ceil(mode.thick/2);dy+=2){
              context.drawImage(offscreen,-item.itemWidth/2+dx-12,-item.itemHeight/2+dy-12);
            }
          }
        }
        context.drawImage(offscreen,-item.itemWidth/2-12,-item.itemHeight/2-12);
        context.restore();
        x+=item.advance;
      }
      y+=lineHeight;
    }
    els.dimensions.textContent=`${canvas.width} × ${canvas.height}px`;
    setStatus(`Ready — seed ${seed}.`,'ok');
    saveState();
    return true;
  }catch(error){
    console.error(error);
    setStatus(`Render failed: ${error.message}`,'err');
    return false;
  }
}
function scheduleRender(){clearTimeout(debounceTimer);debounceTimer=setTimeout(render,130)}
function shuffle(){els.seed.value=String((Date.now()%1000000)||1);render()}
function revealPng(dataUrl){els.exportPreview.src=dataUrl;els.exportPanel.hidden=false;els.exportPanel.scrollIntoView({behavior:'smooth',block:'nearest'})}
function dataUrlToBlob(dataUrl){
  const parts=dataUrl.split(',');
  const mime=(parts[0].match(/:(.*?);/)||[])[1]||'image/png';
  const binary=atob(parts[1]);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
function currentPng(){const dataUrl=els.canvas.toDataURL('image/png');revealPng(dataUrl);return dataUrl}
function saveOrShare(){
  const dataUrl=currentPng();
  const filename=`adam-hand-${Date.now()}.png`;
  const blob=dataUrlToBlob(dataUrl);
  if(typeof File!=='undefined'&&navigator.share){
    const file=new File([blob],filename,{type:'image/png'});
    const shareData={files:[file],title:'Adam Hand PNG'};
    if(!navigator.canShare||navigator.canShare(shareData)){
      navigator.share(shareData).then(()=>setStatus('PNG shared or saved.','ok')).catch(error=>{
        if(error&&error.name!=='AbortError')downloadBlob(blob,filename);
      });
      return;
    }
  }
  downloadBlob(blob,filename);
}
function downloadBlob(blob,filename){
  if(lastObjectUrl)URL.revokeObjectURL(lastObjectUrl);
  lastObjectUrl=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=lastObjectUrl;link.download=filename;link.rel='noopener';
  document.body.appendChild(link);link.click();link.remove();
  setStatus('PNG prepared. If iOS ignores the download, long-press the image below.','ok');
}
function showPng(){currentPng();setStatus('PNG shown below. Long-press it to save.','ok')}
function clearText(){els.text.value='';els.text.focus();scheduleRender()}
function bind(){
  $('renderBtn').addEventListener('click',render);
  $('shuffleBtn').addEventListener('click',shuffle);
  $('saveBtn').addEventListener('click',saveOrShare);
  $('showBtn').addEventListener('click',showPng);
  $('clearBtn').addEventListener('click',clearText);
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
  restoreState();bind();controlsDisabled(false);await render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
start();
})();
