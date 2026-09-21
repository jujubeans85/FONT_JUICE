/* Six device-local image slots; the composer owns lettering and export. */
(()=>{
'use strict';
const C=globalThis.JuiceComposition;
globalThis.JuiceBackgrounds={attach:async function({onChange}){
 const $=id=>document.getElementById(id),select=$('backgroundSlot'),file=$('backgroundFile'),status=$('backgroundStatus');
 const images=Array(6).fill(null),records=Array(6).fill(null);let db=null,busy=false;
 const note=text=>status.textContent=text;
 const settingsKey='juice-background-settings-v1';
 const settings=()=>({slot:select.value,fit:$('backgroundFit').value,wash:$('backgroundWash').value});
 const save=()=>{try{localStorage.setItem(settingsKey,JSON.stringify(settings()))}catch{note('Settings could not be saved on this device.')}};
 const refresh=()=>{for(let i=0;i<6;i++)select.options[i+1].textContent=`${i+1} · ${records[i]?.name||'Empty — add an image'}`};
 const changed=()=>{save();onChange()};
 const selected=()=>Number(select.value);
 const api={draw(ctx,base){C.drawBackground(ctx,{...base,image:images[selected()]||null,fit:$('backgroundFit').value,wash:Number($('backgroundWash').value)/100})}};
 try{
  db=await C.openStore();
  await Promise.all(images.map(async(_,i)=>{try{const r=await C.transact(db,'readonly',i);if(r){images[i]=await C.decode(r.blob);records[i]=r}}catch{note('A saved background could not load. Replace that slot.')}}));
  refresh();
  try{const s=JSON.parse(localStorage.getItem(settingsKey));if(s){select.value=/^[0-5]$/.test(s.slot)?s.slot:'-1';$('backgroundFit').value=s.fit==='contain'?'contain':'cover';$('backgroundWash').value=Math.max(0,Math.min(100,Number(s.wash)||0))}}catch{}
 }catch{note('Device storage unavailable. Images will work for this session only.')}
 select.addEventListener('change',changed);
 for(const id of ['backgroundFit','backgroundWash'])$(id).addEventListener('input',changed);
 for(const [id,step] of [['backgroundPrev',-1],['backgroundNext',1]])$(id).addEventListener('click',()=>{
  if(busy)return;let i=selected();if(i<0)i=step>0?-1:0;
  for(let n=0;n<6;n++){i=(i+step+6)%6;if(images[i]){select.value=String(i);changed();return}}
  note('Add an image to a slot first.');
 });
 $('backgroundAdd').addEventListener('click',()=>{if(busy)return;if(selected()<0){const empty=images.findIndex(x=>!x);select.value=String(empty<0?0:empty)}file.click()});
 file.addEventListener('change',async()=>{
  const upload=file.files[0],slot=selected();file.value='';if(!upload||slot<0||busy)return;
  if(upload.size>20*1024*1024){note('Choose an image smaller than 20 MB.');return}
  busy=true;$('backgroundAdd').disabled=true;$('backgroundRemove').disabled=true;
  try{
   const image=await C.decode(upload);
   if((image.naturalWidth||image.width)*(image.naturalHeight||image.height)>32000000)throw new Error('Image is too large. Choose one under 32 megapixels.');
   const record={name:upload.name,blob:upload};
   if(db)await C.transact(db,'readwrite',slot,record);
   records[slot]=record;images[slot]=image;select.value=String(slot);$('transparent').checked=false;
   refresh();changed();note(db?'Saved on this device.':'Available for this session only.');
  }catch(error){note(`Image not replaced: ${error.message}`)}
  finally{busy=false;$('backgroundAdd').disabled=false;$('backgroundRemove').disabled=false}
 });
 $('backgroundRemove').addEventListener('click',async()=>{
  const slot=selected();if(slot<0||busy)return;busy=true;
  try{if(db)await C.transact(db,'readwrite',slot,null);images[slot]=null;records[slot]=null;refresh();changed();note('Slot cleared.')}catch{note('Could not clear the saved slot. Try again.')}finally{busy=false}
 });
 return api;
}};
})();
