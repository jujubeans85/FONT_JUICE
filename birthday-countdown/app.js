(()=>{
  'use strict';
  const TARGET=new Date('2026-07-21T00:00:00+10:00');
  const FRAGMENTS=[
    'MIMI 21',
    '><)))21>',
    '*><)))21>*',
    'ONE STRANGE FISH',
    'TWO PEOPLE USING IT',
    'FIRST EDITION',
    'ONE OF ONE'
  ];
  const $=id=>document.getElementById(id);
  const pad=value=>String(value).padStart(2,'0');
  function setText(id,value){const el=$(id);if(el)el.textContent=value}
  function tick(){
    const now=new Date();
    const diff=TARGET-now;
    if(diff<=0){
      setText('headline','MIMI 21 IS LIVE');
      setText('days','00');setText('hours','00');setText('minutes','00');setText('seconds','00');
      setText('fragment','FIRST EDITION / ONE OF ONE');
      document.body.classList.add('live');
      return;
    }
    const totalSeconds=Math.floor(diff/1000);
    const days=Math.floor(totalSeconds/86400);
    const hours=Math.floor((totalSeconds%86400)/3600);
    const minutes=Math.floor((totalSeconds%3600)/60);
    const seconds=totalSeconds%60;
    setText('headline',days===1?'1 day to go':`${days} days to go`);
    setText('days',pad(days));
    setText('hours',pad(hours));
    setText('minutes',pad(minutes));
    setText('seconds',pad(seconds));
    const fragmentIndex=Math.floor(now.getTime()/6000)%FRAGMENTS.length;
    setText('fragment',FRAGMENTS[fragmentIndex]);
    document.body.classList.remove('live');
  }
  tick();
  setInterval(tick,1000);
})();
