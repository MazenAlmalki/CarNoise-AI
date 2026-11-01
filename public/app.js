const $ = id => document.getElementById(id);
const welcome=$('welcome'), conversation=$('conversation'), messages=$('messages');
const input=$('description'), sendBtn=$('sendBtn'), choices=$('choices');
const questionBox=$('questionBox'), resultBox=$('resultBox'), errorBox=$('errorBox'), busy=$('busy');
const questions=[
{key:'timing',text:'متى تسمعه؟',options:['عند التشغيل','أثناء القيادة','عند الفرامل','عند الالتفاف','على المطبات','عند التسارع','غير متأكد']},
{key:'sound',text:'وش نوع الصوت؟',options:['طقطقة','صرير','صفير','حكة / احتكاك','ونة','رجّة / اهتزاز','غير متأكد']},
{key:'location',text:'من وين يجي؟',options:['أمام السيارة','خلف السيارة','من جهة الإطارات','من المحرك','غير متأكد']},
{key:'frequency',text:'كم يتكرر؟',options:['كل مرة','أحيانًا','بدأ اليوم','غير متأكد']}
];
let session=null,index=0,submitting=false;
function addMessage(text,who){
 const node=document.createElement('div');node.className='message '+who;
 const label=document.createElement('div');label.className='message-label';label.textContent=who==='user'?'أنت':'CarNoise AI';
 const body=document.createElement('div');body.textContent=text;node.append(label,body);messages.append(node);
 setTimeout(()=>node.scrollIntoView({behavior:'smooth',block:'nearest'}),10);
}
function setError(text){errorBox.textContent=text||'';errorBox.classList.toggle('hidden',!text);}
function reset(){
 session=null;index=0;submitting=false;
 messages.replaceChildren();choices.replaceChildren();resultBox.replaceChildren();
 welcome.classList.remove('hidden');conversation.classList.add('hidden');
 questionBox.classList.add('hidden');resultBox.classList.add('hidden');
 busy.classList.add('hidden');input.disabled=false;sendBtn.disabled=false;input.value='';
 setError('');window.scrollTo({top:0,behavior:'smooth'});
}
function start(value){
 const description=value.trim();
 if(description.length<8){setError('اكتب وصفًا للصوت من 8 أحرف على الأقل.');input.focus();return;}
 setError('');session={description};index=0;
 welcome.classList.add('hidden');conversation.classList.remove('hidden');
 input.value='';input.disabled=true;sendBtn.disabled=true;
 addMessage(description,'user');
 addMessage('خلّنا نحدد الصوت بأربع أسئلة.','assistant');
 showQuestion();
}
function showQuestion(){
 if(!session)return;
 if(index>=questions.length){questionBox.classList.add('hidden');analyze();return;}
 const q=questions[index];questionBox.classList.add('hidden');
 void questionBox.offsetWidth;questionBox.classList.remove('hidden');
 $('questionCount').textContent='السؤال '+(index+1)+' من '+questions.length;
 $('questionProgress').style.width=((index+1)/questions.length*100)+'%';
 $('questionText').textContent=q.text;choices.replaceChildren();
 for(const option of q.options){
  const button=document.createElement('button');button.type='button';button.className='choice';button.textContent=option;
  button.addEventListener('click',()=>{session[q.key]=option;addMessage(option,'user');index++;showQuestion();});
  choices.append(button);
 }
}
function el(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
function renderResult(r){
 resultBox.replaceChildren();resultBox.classList.remove('hidden');
 const titles={low:'للمتابعة',medium:'يستحسن الفحص',high:'يحتاج اهتمامًا عاجلًا'};
 const head=el('div','','result-head');
 head.append(el('span','تحليل Llama','result-kicker'),el('span',titles[r.severity]||'للمراجعة','severity '+r.severity));
 resultBox.append(head,el('h2',r.title),el('p',r.summary),el('h3','الأسباب المحتملة'));
 for(const item of r.reasons||[]){
  const card=el('div','','reason');card.append(el('strong',item.title),el('p',item.explanation));resultBox.append(card);
 }
 resultBox.append(el('h3','وش تسوي الآن؟'));
 const list=el('ul','');for(const step of r.nextSteps||[])list.append(el('li',step));resultBox.append(list);
 if(r.urgentSigns?.length){
  resultBox.append(el('h3','انتبه لهذه العلامات'));
  const ul=el('ul','');for(const s of r.urgentSigns)ul.append(el('li',s));resultBox.append(ul);
 }
 resultBox.append(el('p','احتمالات فقط، وليست بديلًا عن فحص فني.','disclaimer'));
 const again=el('button','بدء تحليل جديد','again');again.type='button';again.addEventListener('click',reset);resultBox.append(again);
 resultBox.scrollIntoView({behavior:'smooth',block:'start'});
}
async function analyze(){
 if(!session||submitting)return;
 submitting=true;setError('');busy.classList.remove('hidden');
 try{
  const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session)});
  let data;try{data=await response.json();}catch{throw new Error('الخادم أعاد استجابة غير مفهومة.');}
  if(!response.ok)throw new Error(data.error||'تعذّر تحليل الصوت حاليًا.');
  if(!data.result||!Array.isArray(data.result.reasons))throw new Error('النتيجة غير مكتملة.');
  addMessage('هذه أبرز الاحتمالات.','assistant');
  renderResult(data.result);
 }catch(error){
  setError(error.message||'تعذّر الاتصال بالخادم.');
  const retry=el('button','إعادة المحاولة','retry');retry.type='button';retry.addEventListener('click',analyze);errorBox.append(document.createElement('br'),retry);
 }finally{busy.classList.add('hidden');submitting=false;}
}
$('composer').addEventListener('submit',event=>{event.preventDefault();if(!submitting&&!session)start(input.value);});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();$('composer').requestSubmit();}});
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>start(button.dataset.example)));
$('sideReset').addEventListener('click',reset);
$('topReset').addEventListener('click',reset);
