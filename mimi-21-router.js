(()=>{
  'use strict';
  const BUILD='2026-07-04-route-3';
  const CSV_URL='./data/nfc-tags-21-v2.csv?v='+BUILD;
  const TARGET_SET='21_v2';
  const $=id=>document.getElementById(id);
  function parseCsv(text){
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
    const headers=lines.shift().split(',').map(h=>h.trim());
    return lines.map(line=>{
      const cells=[];let cell='',quote=false;
      for(let i=0;i<line.length;i++){
        const ch=line[i];
        if(ch==='"'&&line[i+1]==='"'){cell+='"';i++;continue}
        if(ch==='"'){quote=!quote;continue}
        if(ch===','&&!quote){cells.push(cell);cell='';continue}
        cell+=ch;
      }
      cells.push(cell);
      return Object.fromEntries(headers.map((h,i)=>[h,(cells[i]||'').trim()]));
    });
  }
  function normalise(value){return String(value||'').trim().toLowerCase()}
  function slotNumber(slot){const match=String(slot||'').match(/(\d+)/);return match?Number(match[1]):0}
  function routeRequest(){
    const params=new URLSearchParams(location.search);
    const set=params.get('set')||params.get('fishset')||TARGET_SET;
    const fish=params.get('fish')||params.get('id')||'';
    const slot=params.get('slot')||params.get('tag')||params.get('nfc')||'';
    if(!fish&&!slot)return null;
    return {set,fish,slot};
  }
  function findRoute(routes,request){
    const fish=normalise(request.fish);
    const slot=normalise(request.slot).replace(/^0+(\d)$/,'$1');
    return routes.find(row=>normalise(row.id)===fish)
      || routes.find(row=>normalise(row.slot)===slot||normalise(row.physical_label)===slot)
      || routes.find(row=>String(slotNumber(row.slot))===slot);
  }
  function ensureStyles(){
    if($('mimi21RouteStyles'))return;
    const style=document.createElement('style');
    style.id='mimi21RouteStyles';
    style.textContent=`
      .mimi21-route-card{width:min(1180px,calc(100% - 28px));margin:0 auto 16px;border:1px solid #ffffff2a;border-radius:22px;background:linear-gradient(135deg,#fff,#e8e8e8);color:#101113;padding:18px;box-shadow:0 20px 70px #0007}
      .mimi21-route-card .eyebrow{color:#555;margin:0 0 6px;font-size:.72rem;font-weight:950;letter-spacing:.18em}.mimi21-route-card h2{margin:0;font-size:clamp(1.65rem,8vw,4rem);line-height:.95;letter-spacing:-.04em}.mimi21-route-card code{display:block;margin:.8rem 0 0;font:900 clamp(1.4rem,9vw,4.6rem)/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-.08em;white-space:nowrap;overflow:auto}.mimi21-route-card p{margin:.75rem 0 0;color:#333}.mimi21-route-card small{display:block;margin-top:.9rem;color:#555;font-weight:800}.mimi21-route-card.err{background:#221316;color:#fff;border-color:#ff6b72}.mimi21-route-card.debug{background:#121417;color:#f5f6f7;border-color:#ffffff33}.mimi21-route-card.debug p,.mimi21-route-card.debug small{color:#b9bec7}.mimi21-route-card.debug code{font-size:clamp(.9rem,4vw,1.25rem);white-space:normal;letter-spacing:-.03em;line-height:1.25}
    `;
    document.head.appendChild(style);
  }
  function upsertCard(){
    ensureStyles();
    let card=$('mimi21RouteCard');
    if(!card){
      card=document.createElement('section');
      card.id='mimi21RouteCard';
      const main=document.querySelector('main');
      (main&&main.parentNode?main.parentNode:document.body).insertBefore(card,main||document.body.firstChild);
    }
    return card;
  }
  function renderDebug(){
    const card=upsertCard();
    card.className='mimi21-route-card debug';
    card.innerHTML=`<p class="eyebrow">MIMI 21 ROUTER LOADED · ${BUILD}</p><h2>No fish query found</h2><p>This is plain composer mode. NFC links must include <strong>?fish=...&set=21_v2</strong>.</p><code>${location.href}</code>`;
  }
  function renderCard(row,request){
    const card=upsertCard();
    if(!row){
      card.className='mimi21-route-card err';
      card.innerHTML=`<p class="eyebrow">MIMI 21 ROUTE ERROR · ${BUILD}</p><h2>Unknown fish</h2><p>${request.fish||request.slot}</p><code>${location.href}</code><small>Check the NFC URL against data/nfc-tags-21-v2.csv</small>`;
      return;
    }
    card.className='mimi21-route-card';
    card.innerHTML=`<p class="eyebrow">${row.slot} · ${row.category}</p><h2>${row.name}</h2><code>${row.code}</code><p>${row.write_status==='pilot'?'Pilot tag':'Birthday V2 tag'}</p><small>Seed ${2100+slotNumber(row.slot)} · ${row.id} · ${BUILD}</small>`;
    document.title=`${row.slot} ${row.name} · Mimi 21`;
  }
  function setValue(id,value,eventName='input'){
    const el=$(id);if(!el)return false;
    if(el.value!==String(value))el.value=String(value);
    el.dispatchEvent(new Event(eventName,{bubbles:true}));
    return true;
  }
  function kickRender(){
    const btn=$('renderBtn');
    if(btn&&!btn.disabled){try{btn.click()}catch(_error){}}
  }
  async function applyRoute(){
    const request=routeRequest();
    if(!request){renderDebug();return;}
    if(request.set&&request.set!==TARGET_SET){renderDebug();return;}
    const response=await fetch(CSV_URL,{cache:'no-store'});
    if(!response.ok)throw new Error(`Mimi route CSV failed ${response.status}`);
    const routes=parseCsv(await response.text());
    const row=findRoute(routes,request);
    renderCard(row,request);
    if(!row)return;
    const seed=2100+slotNumber(row.slot);
    try{localStorage.removeItem('font-juice-state-v2')}catch(_error){}
    setValue('text',`${row.name}\n${row.code}`,'input');
    setValue('seed',seed,'change');
    const status=$('status');
    if(status)status.textContent=`${row.slot} loaded - seed ${seed}`;
    kickRender();
  }
  let tries=0;
  function run(){
    tries+=1;
    applyRoute().catch(error=>{
      console.warn('[MIMI21 route]',error);
      const request=routeRequest();
      if(request)renderCard(null,request);else renderDebug();
    });
    if(tries<8)setTimeout(run,tries*400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
