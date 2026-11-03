// Render as text nodes only; model strings and stored data never become HTML.
export function renderSoundResult(card,language='ar'){
 if(!card||card.version!==1||!['known_recording','possible_match','no_reliable_match'].includes(card.status)||typeof card.title!=='string'||!Array.isArray(card.steps))return null;
 const ar=language==='ar',section=document.createElement('section');section.className='sound-result';section.dataset.status=card.status;
 const add=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=String(value||'').slice(0,700);if(className)node.className=className;section.append(node);return node;};
 add('h3',card.title);
 if(card.status!=='no_reliable_match'&&card.problem)add('p',card.problem,'sound-result-name');
 add('h4',card.status==='known_recording'?(ar?'وش تعرّفنا عليه':'What was identified'):card.status==='possible_match'?(ar?'ليش ممكن يشبهه':'Why it may match'):(ar?'ليش ما فيه تطابق':'Why there is no match'));add('p',card.why);
 add('h4',ar?'وش تسوي':'What to do');const list=add('ul','');
 for(const step of card.steps.slice(0,3)){if(typeof step!=='string')continue;const li=document.createElement('li');li.textContent=step.slice(0,350);list.append(li);}
 if(card.safety){add('h4',ar?'السلامة':'Safety');add('p',card.safety,'sound-result-safety');}
 if(card.labelNote)add('p',card.labelNote,'sound-result-note');
 const reference=card.reference;
 if(card.status!=='no_reliable_match'&&/^upload[12]-\d{2}$/.test(reference?.id)&&reference.url==='/api/audio-references/'+reference.id){
  const details=add('details',''),summary=document.createElement('summary');summary.textContent=ar?'اسمع المثال':'Play reference';details.append(summary);
  const player=document.createElement('audio');player.controls=true;player.preload='none';player.src=reference.url;player.setAttribute('aria-label',summary.textContent);details.append(player);
 }
 for(const source of (Array.isArray(card.sources)?card.sources:[]).slice(0,2)){
  try{const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password)continue;
   const link=add('a',ar?'المصدر الإرشادي':'Guidance source','sound-result-source');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
  }catch{}
 }
 return section;
}
