const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../speech.js'),'utf8');
function setup(supported=true,prefixed=false){
  let recognition,updates=0;
  class Recognition{constructor(){recognition=this}start(){}stop(){this.stopped=true}abort(){this.aborted=true}}
  const element=()=>({listeners:{},addEventListener(k,f){this.listeners[k]=f},setAttribute(k,v){this[k]=v},focus(){this.focused=true}});
  const text=Object.assign(element(),{value:'Hello',maxLength:5000}),button=element(),status=element();
  const context={navigator:{language:'en-AU'},document:Object.assign(element(),{documentElement:{lang:'en'}}),window:element()};
  if(supported)context[prefixed?'webkitSpeechRecognition':'SpeechRecognition']=Recognition;
  vm.runInNewContext(source,context);
  const controller=context.JuiceFontsSpeech.attach({text,button,status,onInput(){updates++}});
  return {text,button,status,controller,context,get recognition(){return recognition},get updates(){return updates}};
}
function result(r,words,final=true){const item=[{transcript:words}];item.isFinal=final;r.onresult({resultIndex:0,results:[item]})}
for(const prefix of [false,true]){
  const app=setup(true,prefix);app.button.listeners.click();const r=app.recognition;
  assert.equal(app.button['aria-pressed'],'true');
  result(r,'world',false);assert.equal(app.text.value,'Hello');
  result(r,'world');result(r,'world');assert.equal(app.text.value,'Hello world');assert.equal(app.updates,1);
  app.button.listeners.click();assert(r.stopped);r.onend();assert.equal(app.button['aria-pressed'],'false');
  app.button.listeners.click();const late=app.recognition;app.controller.cancel();app.text.value='';result(late,'must not return');assert.equal(app.text.value,'');assert(late.aborted);
  app.button.listeners.click();const typing=app.recognition;app.text.value='Typed';app.text.listeners.input();result(typing,'late');assert.equal(app.text.value,'Typed');
  app.button.listeners.click();app.recognition.onerror({error:'not-allowed'});assert.match(app.status.textContent,/permission/);assert.equal(app.button['aria-pressed'],'false');
  app.text.value='1234';app.text.maxLength=8;app.button.listeners.click();result(app.recognition,'long message');assert.equal(app.text.value.length,8);assert(app.recognition.stopped);
}
const fallback=setup(false);fallback.button.listeners.click();assert(fallback.text.focused);assert.match(fallback.status.textContent,/keyboard/);
console.log('PASS: speech final/interim results, deduplication, stop, clear/typing cancellation, permission errors, length limit, WebKit and keyboard fallback.');
