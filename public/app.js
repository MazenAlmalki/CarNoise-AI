
const $=id=>document.getElementById(id);
const translations={
ar:{
brandSub:'مساعد سيارتك الذكي',newAnalysis:'تحليل جديد',myCars:'سياراتي',history:'سجل المشاكل',localPrivacy:'بيانات سياراتك محفوظة على هذا الجهاز فقط.',workspace:'مساحة سيارتك',aiAssistant:'مساعد ذكي',eyebrow:'افهم سيارتك بشكل أفضل',
heroTitle:'سيارتك تتكلم.<br><span>خلّنا نفهمها.</span>',heroDescription:'اوصف الصوت، وجاوب كم سؤال، واعرف الأسباب المحتملة.',tryExample:'ابدأ بصوت تسمعه',exampleBrakes:'صرير الفرامل',exampleStart:'طقطقة التشغيل',exampleDrive:'ونة مع السرعة',featureOne:'سجل لكل سيارة',featureTwo:'صوت وفيديو',featureThree:'عربي وإنجليزي',
inputPlaceholder:'وش الصوت اللي تسمعه؟',attach:'إرفاق',record:'تسجيل',stop:'إيقاف',analyze:'حلّل الصوت',analyzing:'Llama يحلل الوصف...',disclaimer:'النتائج احتمالية وليست تشخيصًا. المقاطع محفوظة محليًا، ولا يستطيع Llama النصي سماعها حاليًا.',
addVehicle:'إضافة سيارة',vehicleName:'اسم السيارة',carPlaceholder:'مثال: كامري 2022',cancel:'إلغاء',save:'حفظ',defaultCar:'سيارتي',noHistory:'ما فيه تحليلات سابقة',question:'السؤال',of:'من',introMessage:'خلّنا نحدد الصوت بأربع أسئلة.',resultIntro:'هذه احتمالات حسب وصفك.',possibleReasons:'الأسباب المحتملة',nextSteps:'وش تسوي؟',urgentSigns:'علامات مهمة',resultLabel:'تحليل Llama',resultNotice:'التحليل احتمالي، مو تشخيص فني.',newCheck:'تحليل جديد',low:'للمتابعة',medium:'يستحسن الفحص',high:'اهتمام عاجل',required:'اوصف الصوت بثمانية أحرف على الأقل.',mediaInfo:'المقطع محفوظ للرجوع له فقط. Llama الحالي ما يسمع الصوت أو الفيديو.',fileTooLarge:'الحد الأقصى 25MB للمقطع.',fileType:'ارفع ملف صوت أو فيديو فقط.',mediaSaved:'مقطع محفوظ',mediaMissing:'المقطع غير متوفر على هذا الجهاز.',recordUnsupported:'المتصفح ما يدعم التسجيل.',recordError:'ما قدرنا نستخدم الميكروفون. تأكد من السماح له.',storageError:'تعذّر حفظ المقطع. جرّب ملف أصغر.',localOnly:'يتم الحفظ على هذا الجهاز فقط',remove:'إزالة',retry:'إعادة المحاولة',carNeeded:'أدخل اسم السيارة.',answerFailed:'تعذّر التحليل، حاول مرة ثانية.',startAgain:'ابدأ تحليلًا جديدًا',
questions:[['متى تسمعه؟',['عند التشغيل','أثناء القيادة','عند الفرامل','عند الالتفاف','على المطبات','عند التسارع','غير متأكد']],['وش نوع الصوت؟',['طقطقة','صرير','صفير','حكة / احتكاك','ونة','رجّة / اهتزاز','غير متأكد']],['من وين يجي؟',['أمام السيارة','خلف السيارة','من جهة الإطارات','من المحرك','غير متأكد']],['كم يتكرر؟',['كل مرة','أحيانًا','بدأ اليوم','غير متأكد']]],
examples:{brakes:'أسمع صرير عالي لما أضغط على الفرامل',starting:'فيه طقطقة أول ما أشغل السيارة الصباح',driving:'أسمع ونة تزيد كل ما زادت سرعة السيارة'}
},
en:{
brandSub:'Your car companion',newAnalysis:'New analysis',myCars:'My vehicles',history:'Problem history',localPrivacy:'Vehicle history is saved on this device only.',workspace:'Your garage',aiAssistant:'AI assistant',eyebrow:'Understand your car better',
heroTitle:'Your car is talking.<br><span>Let’s figure it out.</span>',heroDescription:'Describe the noise. Answer a few questions. Explore possible causes.',tryExample:'Try an example',exampleBrakes:'Brake squeal',exampleStart:'Startup clicking',exampleDrive:'Humming at speed',featureOne:'History for each car',featureTwo:'Audio & video',featureThree:'Arabic & English',
inputPlaceholder:'Describe the sound you hear...',attach:'Attach',record:'Record',stop:'Stop',analyze:'Analyze sound',analyzing:'Llama is analyzing your description...',disclaimer:'Results are possibilities, not a diagnosis. Media stays on your device; text-only Llama cannot listen to it yet.',
addVehicle:'Add a vehicle',vehicleName:'Vehicle name',carPlaceholder:'e.g. Camry 2022',cancel:'Cancel',save:'Save',defaultCar:'My car',noHistory:'No past analyses',question:'Question',of:'of',introMessage:'Four quick questions to narrow it down.',resultIntro:'Here are some possibilities based on your description.',possibleReasons:'Possible causes',nextSteps:'What to do next',urgentSigns:'Important warning signs',resultLabel:'Llama analysis',resultNotice:'Possibilities only. Not a mechanic’s diagnosis.',newCheck:'New analysis',low:'Monitor',medium:'Inspection advised',high:'Urgent attention',required:'Describe the noise using at least 8 characters.',mediaInfo:'Saved for review only. The current Llama model cannot hear audio or video.',fileTooLarge:'Maximum media file size is 25 MB.',fileType:'Please choose audio or video.',mediaSaved:'Saved media',mediaMissing:'Media unavailable on this device.',recordUnsupported:'Audio recording is not supported by this browser.',recordError:'Cannot access the microphone. Check permissions.',storageError:'Could not save media. Try a smaller file.',localOnly:'Stored on this device only',remove:'Remove',retry:'Try again',carNeeded:'Enter a vehicle name.',answerFailed:'Analysis failed. Please try again.',startAgain:'Start a new analysis',
questions:[['When do you hear it?',['When starting','While driving','When braking','When turning','Over bumps','When accelerating','Not sure']],['What does it sound like?',['Clicking','Squealing','Whistling','Scraping','Humming','Vibration','Not sure']],['Where does it come from?',['Front of car','Rear of car','Near wheels','Engine bay','Not sure']],['How often?',['Every time','Sometimes','Started today','Not sure']]],
examples:{brakes:'I hear a high-pitched squeal when pressing the brakes.',starting:'There is a clicking noise when I start the car.',driving:'There is a humming noise that gets louder as I drive faster.'}
}
};
const optionKeys=['timing','sound','location','frequency'];
const STORAGE_KEY='carnoise-garage-v2';
const makeId=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
function loadState(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(data&&Array.isArray(data.cars)&&data.cars.length)return {cars:data.cars,cases:Array.isArray(data.cases)?data.cases:[],carId:data.carId||data.cars[0].id,lang:data.lang==='en'?'en':'ar',theme:data.theme==='light'?'light':'dark'};}catch{}const car={id:makeId(),nameAr:'سيارتي',nameEn:'My car'};return {cars:[car],cases:[],carId:car.id,lang:'ar',theme:'dark'};}
const state=loadState();
let session=null,questionIndex=0,submitting=false,pendingMedia=null,pendingUrl=null,recording=null,mediaStream=null,mediaChunks=[],recorder=null;
const t=k=>translations[state.lang][k],qList=()=>translations[state.lang].questions;
const textNode=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{showError(t('storageError'));}}
function showError(message){$('errorBox').replaceChildren();$('errorBox').textContent=message||'';$('errorBox').classList.toggle('hidden',!message);}
function carName(car){return car.name||(state.lang==='ar'?car.nameAr:car.nameEn)||t('defaultCar');}
function selectedCar(){return state.cars.find(c=>c.id===state.carId)||state.cars[0];}
function dateLabel(iso){return new Date(iso).toLocaleDateString(state.lang==='ar'?'ar-SA':'en-US',{day:'numeric',month:'short'});}
function renderSidebar(){
 $('carList').replaceChildren();$('historyList').replaceChildren();
 $('currentCarName').textContent=carName(selectedCar());
 for(const car of state.cars){
  const button=document.createElement('button');button.className='car-row'+(state.carId===car.id?' active':'');button.type='button';
  button.append(textNode('span','◇','car-symbol'),textNode('span',carName(car),'car-name'),textNode('span',String(state.cases.filter(c=>c.carId===car.id).length),'car-count'));
  button.addEventListener('click',()=>{state.carId=car.id;persist();renderSidebar();newAnalysis();closeNav();});
  $('carList').append(button);
 }
 const history=state.cases.filter(c=>c.carId===state.carId).slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 $('historyCount').textContent=String(history.length);
 if(!history.length)$('historyList').append(textNode('div',t('noHistory'),'empty-side'));
 for(const entry of history){
  const button=document.createElement('button');button.type='button';button.className='history-row'+(session?.id===entry.id?' active':'');
  button.append(textNode('span',entry.description.slice(0,45),'history-name'),textNode('span',dateLabel(entry.createdAt),'history-date'));
  button.addEventListener('click',()=>{loadCase(entry);closeNav();});$('historyList').append(button);
 }
}
function applySettings(){
 const root=document.documentElement;root.lang=state.lang;root.dir=state.lang==='ar'?'rtl':'ltr';root.dataset.theme=state.theme;
 document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
 document.querySelectorAll('[data-i18n-html]').forEach(n=>{const key=n.dataset.i18nHtml;if(key==='heroTitle')n.innerHTML=t(key);});
 document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>n.placeholder=t(n.dataset.i18nPlaceholder));
 $('languageSwitch').textContent=state.lang==='ar'?'EN':'عربي';
 $('themeSwitch').textContent=state.theme==='dark'?'☀':'☾';
 $('recordButton').querySelector('span').textContent=recording?t('stop'):t('record');
 renderSidebar();
 if(session)renderSession();
}
function addMessage(message,role){
 const wrap=textNode('div','','message '+role);wrap.append(textNode('div',role==='user'?(state.lang==='ar'?'أنت':'You'):'CarNoise AI','message-label'),textNode('div',message));$('messages').append(wrap);
}
function newAnalysis(){
 session=null;questionIndex=0;submitting=false;$('intro').classList.remove('hidden');$('conversation').classList.add('hidden');$('questionBox').classList.add('hidden');$('resultBox').classList.add('hidden');$('busy').classList.add('hidden');$('messages').replaceChildren();$('description').disabled=false;$('sendButton').disabled=false;$('description').value='';showError('');clearPendingMedia();renderSidebar();
}
function createCase(description){
 const entry={id:makeId(),carId:state.carId,createdAt:new Date().toISOString(),description,lang:state.lang,answers:[],result:null,mediaId:null,mediaType:null,mediaName:null};
 state.cases.push(entry);session=entry;questionIndex=0;persist();renderSidebar();return entry;
}
async function startAnalysis(description){
 if(description.trim().length<8){showError(t('required'));$('description').focus();return;}
 if(session){showError(t('startAgain'));return;}
 showError('');
 const entry=createCase(description.trim());
 if(pendingMedia){
  try{await saveBlob(entry.id,pendingMedia);entry.mediaId=entry.id;entry.mediaType=pendingMedia.type;entry.mediaName=pendingMedia.name;persist();}
  catch(e){showError(t('storageError'));}
 }
 clearPendingMedia();$('description').value='';renderSession();
}
function renderSession(){
 if(!session)return;
 $('intro').classList.add('hidden');$('conversation').classList.remove('hidden');$('messages').replaceChildren();$('resultBox').replaceChildren();
 addMessage(session.description,'user');
 if(session.mediaName)addMessage((state.lang==='ar'?'ملف مرفق: ':'Attached: ')+session.mediaName,'user');
 addMessage(t('introMessage'),'assistant');
 for(let i=0;i<session.answers.length;i++){
  const answer=session.answers[i],idx=translations.ar.questions[i][1].indexOf(answer);
  addMessage(qList()[i][1][idx]||answer,'user');
 }
 $('description').disabled=true;$('sendButton').disabled=true;
 questionIndex=session.answers.length;
 if(session.result){$('questionBox').classList.add('hidden');renderResult(session.result);if(session.mediaId)showSavedMedia(session.mediaId,session.mediaType,session.mediaName);return;}
 if(questionIndex>=4){$('questionBox').classList.add('hidden');if(!submitting)analyze();return;}
 showQuestion();
 if(session.mediaId)showSavedMedia(session.mediaId,session.mediaType,session.mediaName);
}
function showQuestion(){
 const list=qList(),current=list[questionIndex];
 $('questionBox').classList.add('hidden');void $('questionBox').offsetWidth;$('questionBox').classList.remove('hidden');
 $('questionCount').textContent=t('question')+' '+(questionIndex+1)+' '+t('of')+' 4';
 $('questionProgress').style.width=(questionIndex+1)*25+'%';$('questionText').textContent=current[0];$('choices').replaceChildren();
 current[1].forEach((choice,i)=>{
  const button=textNode('button',choice,'choice');button.type='button';
  button.addEventListener('click',()=>{if(!session||submitting)return;session.answers.push(translations.ar.questions[questionIndex][1][i]);persist();renderSession();});
  $('choices').append(button);
 });
}
function renderResult(r){
 $('resultBox').replaceChildren();$('resultBox').classList.remove('hidden');
 const head=textNode('div','','results-head'),severity=textNode('span',t(r.severity),'severity '+r.severity);
 head.append(textNode('span',t('resultLabel')),severity);$('resultBox').append(head,textNode('h2',r.title),textNode('p',r.summary),textNode('h3',t('possibleReasons')));
 for(const reason of r.reasons||[]){const box=textNode('div','','reason');box.append(textNode('strong',reason.title),textNode('p',reason.explanation));$('resultBox').append(box);}
 $('resultBox').append(textNode('h3',t('nextSteps')));const ul=document.createElement('ul');
 for(const x of r.nextSteps||[])ul.append(textNode('li',x));$('resultBox').append(ul);
 if(r.urgentSigns?.length){$('resultBox').append(textNode('h3',t('urgentSigns')));const list=document.createElement('ul');for(const x of r.urgentSigns)list.append(textNode('li',x));$('resultBox').append(list);}
 $('resultBox').append(textNode('p',t('resultNotice'),'disclaimer'));
 const again=textNode('button',t('newCheck'),'again');again.type='button';again.addEventListener('click',newAnalysis);$('resultBox').append(again);
}
async function analyze(){
 if(!session||submitting)return;
 submitting=true;showError('');$('busy').classList.remove('hidden');
 const previous=state.cases.filter(c=>c.carId===session.carId&&c.id!==session.id&&c.result).slice(-5).map(c=>({date:c.createdAt.slice(0,10),description:c.description.slice(0,250),suspectedSummary:String(c.result.summary||'').slice(0,250)}));
 const body={description:session.description,language:session.lang||'ar',history:previous};
 for(let i=0;i<4;i++)body[optionKeys[i]]=session.answers[i];
 try{
  const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let data;try{data=await response.json();}catch{throw Error(t('answerFailed'));}
  if(!response.ok)throw Error(data.error||t('answerFailed'));
  if(!data.result||!Array.isArray(data.result.reasons))throw Error(t('answerFailed'));
  session.result=data.result;persist();
  $('questionBox').classList.add('hidden');renderResult(data.result);
 }catch(e){showError(e.message||t('answerFailed'));const retry=textNode('button',t('retry'),'retry');retry.type='button';retry.addEventListener('click',analyze);$('errorBox').append(document.createElement('br'),retry);}
 finally{submitting=false;$('busy').classList.add('hidden');}
}
function loadCase(entry){clearPendingMedia();session=entry;renderSidebar();showError('');renderSession();}
function openNav(){$('sidebar').classList.add('open');$('overlay').classList.remove('hidden');}
function closeNav(){$('sidebar').classList.remove('open');$('overlay').classList.add('hidden');}
function openCarDialog(){$('carDialog').showModal();$('carName').focus();}
async function openDb(){
 return new Promise((resolve,reject)=>{
  if(!indexedDB)return reject(new Error('IndexedDB unavailable'));
  const request=indexedDB.open('carnoise-media',1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('files'))request.result.createObjectStore('files');};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function saveBlob(id,file){
 const db=await openDb();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
 finally{db.close();}
}
async function readBlob(id){
 const db=await openDb();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files','readonly');const req=tx.objectStore('files').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
 finally{db.close();}
}
function clearPendingMedia(){
 pendingMedia=null;if(pendingUrl){URL.revokeObjectURL(pendingUrl);pendingUrl=null;}
 $('mediaInput').value='';$('mediaPreview').replaceChildren();$('mediaPreview').classList.add('hidden');
}
function showMedia(file,pending=true){
 const area=$('mediaPreview');area.replaceChildren();area.classList.remove('hidden');
 const url=URL.createObjectURL(file);
 if(pending){if(pendingUrl)URL.revokeObjectURL(pendingUrl);pendingUrl=url;}
 const node=document.createElement(file.type.startsWith('video/')?'video':'audio');
 node.controls=true;node.preload='metadata';node.src=url;node.onended=()=>{};
 area.append(textNode('span',file.name||t('mediaSaved'),'media-name'),node);
 if(pending){const remove=textNode('button','✕','remove-media');remove.type='button';remove.title=t('remove');remove.addEventListener('click',clearPendingMedia);area.append(remove);}
 else node.addEventListener('loadedmetadata',()=>{}, {once:true});
 area.append(textNode('div',t('mediaInfo'),'media-warning'));
 if(!pending)node.addEventListener('emptied',()=>URL.revokeObjectURL(url),{once:true});
}
async function showSavedMedia(id,type,name){
 try{const f=await readBlob(id);if(!session||session.mediaId!==id||!f)return;
  const box=$('resultBox');const attached=textNode('div','','reason');attached.append(textNode('strong',name||t('mediaSaved')));
  const url=URL.createObjectURL(f);const media=document.createElement(type?.startsWith('video/')?'video':'audio');media.controls=true;media.preload='metadata';media.src=url;media.style.maxWidth='100%';media.style.maxHeight='220px';
  attached.append(media,textNode('p',t('mediaInfo')));
  if(!box.classList.contains('hidden'))box.append(attached);else {$('messages').append(attached);}
 }catch{showError(t('mediaMissing'));}
}
function mediaFile(file){
 if(!file)return;
 if(!file.type.startsWith('audio/')&&!file.type.startsWith('video/')){showError(t('fileType'));return;}
 if(file.size>25*1024*1024){showError(t('fileTooLarge'));return;}
 pendingMedia=file;showError('');showMedia(file);
}
async function recordToggle(){
 if(recorder?.state==='recording'){recorder.stop();return;}
 if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder){showError(t('recordUnsupported'));return;}
 try{
  mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});
  recorder=new MediaRecorder(mediaStream);mediaChunks=[];
  recorder.ondataavailable=e=>{if(e.data?.size)mediaChunks.push(e.data);};
  recorder.onstop=()=>{
   const blob=new Blob(mediaChunks,{type:recorder.mimeType||'audio/webm'});const type=blob.type.split(';')[0];
   if(blob.size>0)mediaFile(new File([blob],'recording-'+Date.now()+'.webm',{type}));
   mediaStream?.getTracks().forEach(track=>track.stop());mediaStream=null;recording=false;
   $('recordButton').classList.remove('recording');$('recordButton').querySelector('span').textContent=t('record');
  };
  recorder.start();recording=true;$('recordButton').classList.add('recording');$('recordButton').querySelector('span').textContent=t('stop');
 }catch{showError(t('recordError'));mediaStream?.getTracks().forEach(track=>track.stop());}
}
$('addCar').addEventListener('click',openCarDialog);
$('carForm').addEventListener('submit',e=>{
 e.preventDefault();const name=$('carName').value.trim();if(!name)return;
 const car={id:makeId(),name};state.cars.push(car);state.carId=car.id;persist();$('carDialog').close();$('carForm').reset();newAnalysis();closeNav();
});
for(const id of ['cancelCar','cancelCarBottom'])$(id).addEventListener('click',()=>$('carDialog').close());
$('languageSwitch').addEventListener('click',()=>{state.lang=state.lang==='ar'?'en':'ar';persist();applySettings();});
$('themeSwitch').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';persist();applySettings();});
$('newCaseSide').addEventListener('click',()=>{newAnalysis();closeNav();});
$('menuButton').addEventListener('click',openNav);
$('closeSidebar').addEventListener('click',closeNav);
$('overlay').addEventListener('click',closeNav);
$('composer').addEventListener('submit',e=>{e.preventDefault();if(!session&&!submitting)startAnalysis($('description').value);});
$('description').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('composer').requestSubmit();}});
$('attachButton').addEventListener('click',()=>$('mediaInput').click());
$('mediaInput').addEventListener('change',e=>mediaFile(e.target.files?.[0]));
$('recordButton').addEventListener('click',recordToggle);
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{if(!session)startAnalysis(t('examples')[button.dataset.example]);}));
applySettings();
