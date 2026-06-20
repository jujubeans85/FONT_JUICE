const VERSION='font-juice-mask-v7';
const OLD="function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('A handwriting glyph could not load'));image.src=src})}";
const FIX=`function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      try{
        const mask=document.createElement('canvas');
        mask.width=image.naturalWidth||image.width;
        mask.height=image.naturalHeight||image.height;
        const ctx=mask.getContext('2d',{willReadFrequently:true});
        if(!ctx)throw new Error('2D canvas unavailable');
        ctx.drawImage(image,0,0);
        const pixels=ctx.getImageData(0,0,mask.width,mask.height);
        const data=pixels.data;
        const count=mask.width*mask.height;
        const luma=i=>.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
        let transparent=0,borderLuma=0,borderCount=0;
        for(let y=0;y<mask.height;y++){
          for(let x=0;x<mask.width;x++){
            const i=(y*mask.width+x)*4;
            if(data[i+3]<250)transparent++;
            if(x===0||y===0||x===mask.width-1||y===mask.height-1){borderLuma+=luma(i);borderCount++}
          }
        }
        const hasAlpha=transparent/count>.005;
        const darkBackground=(borderCount?borderLuma/borderCount:0)<128;
        let occupied=0,borderOccupied=0;
        for(let y=0;y<mask.height;y++){
          for(let x=0;x<mask.width;x++){
            const i=(y*mask.width+x)*4;
            const alpha=hasAlpha?data[i+3]:Math.round(darkBackground?luma(i):255-luma(i));
            data[i]=255;data[i+1]=255;data[i+2]=255;data[i+3]=alpha;
            if(alpha>12){occupied++;if(x===0||y===0||x===mask.width-1||y===mask.height-1)borderOccupied++}
          }
        }
        const coverage=occupied/count;
        const borderCoverage=borderCount?borderOccupied/borderCount:0;
        if(coverage<.001)throw new Error('A handwriting glyph mask is empty');
        if(coverage>.96&&borderCoverage>.9)throw new Error('A handwriting glyph became a solid rectangle');
        ctx.clearRect(0,0,mask.width,mask.height);
        ctx.putImageData(pixels,0,0);
        resolve(mask);
      }catch(error){reject(error)}
    };
    image.onerror=()=>reject(new Error('A handwriting glyph could not load'));
    image.src=src;
  });
}`;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('font-juice-')).map(key=>caches.delete(key)));
  await self.clients.claim();
  const windows=await self.clients.matchAll({type:'window'});
  for(const client of windows){
    const url=new URL(client.url);
    if(url.pathname.endsWith('/FONT_JUICE/')||url.pathname.endsWith('/FONT_JUICE/index.html')){
      url.searchParams.set('mask','7');
      try{await client.navigate(url.href)}catch(_error){}
    }
  }
})()));
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate')return;
  const url=new URL(event.request.url);
  if(!url.pathname.includes('/FONT_JUICE/'))return;
  event.respondWith((async()=>{
    const response=await fetch(event.request,{cache:'no-store'});
    let html=await response.text();
    if(html.includes(OLD))html=html.replace(OLD,FIX);
    html=html.replace('FONT_JUICE · V05','FONT_JUICE · V07');
    const headers=new Headers(response.headers);
    headers.set('content-type','text/html; charset=utf-8');
    headers.set('cache-control','no-store, max-age=0');
    headers.set('x-font-juice-fix',VERSION);
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  })());
});
