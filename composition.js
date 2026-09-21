/* Reusable image layer. No dependency on handwriting, UI, or output format. */
(()=>{
'use strict';
function drawBackground(ctx,{image=null,color='#ffffff',transparent=false,fit='cover',wash=0}={}){
  if(transparent)return;
  const {width:w,height:h}=ctx.canvas;
  ctx.save();ctx.fillStyle=color;ctx.fillRect(0,0,w,h);
  if(image){
    const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
    const scale=(fit==='contain'?Math.min:Math.max)(w/iw,h/ih);
    ctx.drawImage(image,(w-iw*scale)/2,(h-ih*scale)/2,iw*scale,ih*scale);
    ctx.globalAlpha=Math.max(0,Math.min(1,Number(wash)||0));
    ctx.fillStyle=color;ctx.fillRect(0,0,w,h);
  }
  ctx.restore();
}
function decode(blob){return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(blob),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Cannot open this image. Try JPEG, PNG or WebP.'))};
  image.src=url;
})}
function openStore(name='juice-backgrounds-v1'){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('slots');
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Close other J-Fonts tabs and reload.'));
    request.onsuccess=()=>resolve(request.result);
  });
}
async function transact(db,mode,key,value){return new Promise((resolve,reject)=>{
  const tx=db.transaction('slots',mode),store=tx.objectStore('slots');
  const request=mode==='readonly'?store.get(key):value===null?store.delete(key):store.put(value,key);
  tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage unavailable'));
})}
globalThis.JuiceComposition={drawBackground,decode,openStore,transact};
})();
