const VERSION='font-juice-mask-v6';
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
        ctx.drawImage(image,0,0);
        const pixels=ctx.getImageData(0,0,mask.width,mask.height);
        const data=pixels.data;
        for(let i=0;i<data.length;i+=4){
          const luminance=Math.max(data[i],data[i+1],data[i+2]);
          const sourceAlpha=data[i+3]/255;
          const normalized=Math.max(0,Math.min(255,(luminance-8)*1.12));
          data[i]=255;data[i+1]=255;data[i+2]=255;
          data[i+3]=Math.round(normalized*sourceAlpha);
        }
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
  await self.clients.claim();
  const windows=await self.clients.matchAll({type:'window'});
  for(const client of windows){
    const url=new URL(client.url);
    if(url.pathname.endsWith('/FONT_JUICE/')||url.pathname.endsWith('/FONT_JUICE/index.html')){
      url.searchParams.set('mask','6');
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
    html=html.replace('FONT_JUICE · V05','FONT_JUICE · V06');
    const headers=new Headers(response.headers);
    headers.set('content-type','text/html; charset=utf-8');
    headers.set('cache-control','no-store, max-age=0');
    headers.set('x-font-juice-fix',VERSION);
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  })());
});
