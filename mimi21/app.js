const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const fishId=params.get('fish')||params.get('id')||'';
const slot=params.get('slot')||params.get('tag')||'';
const fish=window.MIMI21_FISH||[];
const match=fish.find(f=>f[1]===fishId)||fish.find(f=>f[0].toLowerCase()===String(slot).toLowerCase())||fish[2];
function seed(row){return 2100+Number(row[0].replace(/\D/g,''));}
function renderFish(row){
  const card=$('fishCard');
  if(!row){card.className='card err';card.innerHTML='<p class="eyebrow">ROUTE ERROR</p><h2>Unknown fish</h2><p class="meta">'+location.href+'</p>';return;}
  card.className='card';
  card.innerHTML='<p class="eyebrow">'+row[0]+' · '+row[3]+'</p><h2>'+row[2]+'</h2><code class="code"></code><p class="meta">Seed '+seed(row)+' · '+row[1]+' · '+row[5]+'</p>';
  card.querySelector('code').textContent=row[4];
  document.title=row[0]+' '+row[2]+' · MIMI 21';
  $('routeSub').textContent='NFC route loaded: '+row[1];
  const u=new URL(location.href);u.search='?fish='+encodeURIComponent(row[1])+'&set=21_v2';$('copyLink').href=u.href;
}
function renderList(){
  const list=$('list');list.innerHTML='';
  for(const row of fish){const a=document.createElement('a');a.className='row';a.href='?fish='+encodeURIComponent(row[1])+'&set=21_v2';a.innerHTML='<b>'+row[0]+' '+row[2]+'</b><code></code>';a.querySelector('code').textContent=row[4];list.appendChild(a);}
}
const TARGET=new Date('2026-07-21T00:00:00+10:00');
function tick(){
  const diff=TARGET-new Date();
  if(diff<=0){['days','hours','minutes','seconds'].forEach(id=>$(id).textContent='00');return;}
  const s=Math.floor(diff/1000);
  $('days').textContent=String(Math.floor(s/86400)).padStart(2,'0');
  $('hours').textContent=String(Math.floor(s%86400/3600)).padStart(2,'0');
  $('minutes').textContent=String(Math.floor(s%3600/60)).padStart(2,'0');
  $('seconds').textContent=String(s%60).padStart(2,'0');
}
renderFish(match);renderList();tick();setInterval(tick,1000);
