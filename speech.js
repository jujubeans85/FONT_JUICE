/* Optional browser dictation. Rendering itself needs no speech service. */
globalThis.JuiceFontsSpeech={attach({text,button,status,onInput}){
  const Recognition=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
  let active=null;
  const idle=()=>{button.textContent='🎙 Speak to add text';button.setAttribute('aria-pressed','false')};
  const hint='Tap the text box and use your keyboard’s microphone instead.';
  function cancel(){
    const session=active;active=null;idle();
    if(session){try{session.recognition.abort()}catch{}status.textContent='Dictation stopped.'}
  }
  button.addEventListener('click',()=>{
    if(active){
      try{active.recognition.stop();button.textContent='Finishing dictation…'}catch{cancel()}
      return;
    }
    if(!Recognition){text.focus();status.textContent='Browser dictation is unavailable here. '+hint;return}
    let session;
    try{
      const recognition=new Recognition();
      session={recognition,seen:new Set(),error:false};active=session;
      recognition.lang=document.documentElement.lang==='en'?'en-AU':document.documentElement.lang||navigator.language||'en-AU';
      recognition.continuous=true;recognition.interimResults=true;
      recognition.onstart=()=>{if(active===session)status.textContent='Listening… speak your message, then tap Stop.'};
      recognition.onresult=event=>{
        if(active!==session)return;
        let interim='',changed=false;
        for(let i=event.resultIndex;i<event.results.length;i++){
          const result=event.results[i],words=result[0].transcript.trim();
          if(!result.isFinal){interim+=words+' ';continue}
          if(session.seen.has(i))continue;
          session.seen.add(i);
          if(!words)continue;
          const separator=text.value&&!/\s$/.test(text.value)?' ':'';
          const addition=separator+words;
          const room=Math.max(0,(text.maxLength>0?text.maxLength:5000)-text.value.length);
          text.value+=addition.slice(0,room);changed=true;
          if(addition.length>room){status.textContent='Text limit reached. Start a new message to continue.';session.error=true;recognition.stop()}
        }
        if(changed)onInput();
        if(!session.error)status.textContent=interim?'Hearing: '+interim:'Added to your message. Listening…';
      };
      recognition.onerror=event=>{
        if(active!==session)return;
        session.error=true;
        const messages={'not-allowed':'Microphone permission was not granted.','service-not-allowed':'Speech service is unavailable.','audio-capture':'No microphone is available.','network':'Speech service could not connect.','no-speech':'No speech was heard.','aborted':'Dictation stopped.'};
        status.textContent=(messages[event.error]||'Dictation could not continue.')+' '+hint;
        active=null;idle();
        try{recognition.abort()}catch{}
      };
      recognition.onend=()=>{if(active!==session)return;active=null;idle();if(!session.error)status.textContent='Dictation finished. You can edit your words or speak again.'};
      button.textContent='Stop listening';button.setAttribute('aria-pressed','true');status.textContent='Starting microphone…';
      recognition.start();
    }catch{
      active=null;idle();status.textContent='Could not start dictation. '+hint;
    }
  });
  // Typing and Clear take precedence over late recognition results.
  text.addEventListener('input',cancel);
  window.addEventListener('pagehide',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
  if(!Recognition)status.textContent='Use your keyboard’s microphone, or tap above for help.';
  return {cancel};
}};
