import {renderSoundResult} from './sound-result.js';
import {validateMedia,MEDIA_ACCEPT} from './media-formats.js';
import {createReplyDelivery} from './reply-delivery.js';
import {renderReferenceExample} from './reference-example.js';
import {createCinematicIntro} from './cinematic-intro.js';
import {createVoice} from './voice.js';
import {summarizeQuestionMemory} from './questionMemory.js';
import {caseTitle,filterCases,buildProblemSummary,summaryText} from './case-tools.js';
import {createRecordingMeter} from './recording-meter.js';
import {uploadMedia} from './media-upload.js';
const $=id=>document.getElementById(id);
// Shared product copy for the Arabic and English layouts.
const translations={
  "ar": {
    "newAnalysis": "افتح موضوع جديد",
    "myCars": "سياراتي",
    "history": "محادثات السيارة",
    "localPrivacy": "سجلك على هذا الجهاز. تُرسل رسائلك للمزود، والمرفقات تُرفع مؤقتًا عند الإرسال.",
    "workspace": "مساحة سيارتك",
    "aiAssistant": "مساعد ذكي",
    "eyebrow": "أهلًا بك في ورشتك",
    "heroTitle": "سيارتك لها حكاية.<br><span>نفهمها مع بعض.</span>",
    "heroDescription": "صوت جديد؟ رجّة غريبة؟ اكتب اللي تلاحظه أو شارك مقطع، ونرتّب لك الاحتمالات والخطوة الجاية.",
    "tryExample": "وش اللي ملاحظ؟",
    "exampleBrakes": "الفرامل تصفّر",
    "exampleStart": "طقطقة عند التشغيل",
    "exampleDrive": "صوت يزيد مع السرعة",
    "inputPlaceholder": "خذ راحتك… وش اللي صاير مع سيارتك؟",
    "attach": "إرفاق",
    "record": "إملاء صوتي",
    "cancelDictation": "إلغاء الإملاء",
    "stop": "إيقاف",
    "analyze": "إرسال",
    "analyzing": "نراجع تفاصيل كلامك",
    "disclaimer": "ورشتك يساعدك تفهم الاحتمالات، ولا يغني عن فحص مختص. المرفقات تُرفع مؤقتًا عند الإرسال.",
    "addVehicle": "إضافة سيارة",
    "vehicleName": "اسم السيارة",
    "carPlaceholder": "مثال: كامري 2022",
    "cancel": "إلغاء",
    "save": "حفظ",
    "defaultCar": "سيارتي",
    "noHistory": "كل مشوار يبدأ بمحادثة. سجلاتك بتكون هنا.",
    "question": "السؤال",
    "of": "من",
    "introMessage": "خلّنا نحدد الصوت بأربع أسئلة.",
    "resultIntro": "هذه احتمالات حسب وصفك.",
    "possibleReasons": "الأسباب المحتملة",
    "nextSteps": "وش تسوي؟",
    "urgentSigns": "علامات مهمة",
    "resultLabel": "تحليل Llama",
    "resultNotice": "التحليل احتمالي، مو تشخيص فني.",
    "newCheck": "تحليل جديد",
    "low": "للمتابعة",
    "medium": "يستحسن الفحص",
    "high": "اهتمام عاجل",
    "required": "اوصف الصوت بثمانية أحرف على الأقل.",
    "mediaInfo": "حتى 25 MB. يُرفع المرفق عند الإرسال، وقد يُرسل الصوت إلى Google أو Groq حسب إعدادات التحليل والتفريغ. قدرات التحليل تعتمد على الإعدادات.",
    "fileTooLarge": "الحد الأقصى 25MB للمقطع.",
    "fileType": "ارفع صورة أو ملف صوت أو فيديو.",
    "mediaSaved": "مقطع محفوظ",
    "mediaMissing": "المقطع غير متوفر على هذا الجهاز.",
    "recordUnsupported": "المتصفح ما يدعم التسجيل.",
    "recordError": "ما قدرنا نستخدم الميكروفون. تأكد من السماح له.",
    "storageError": "تعذّر حفظ المقطع. جرّب ملف أصغر.",
    "localOnly": "يتم الحفظ على هذا الجهاز فقط",
    "remove": "إزالة",
    "deleteCase": "حذف السجل",
    "deleteCar": "حذف السيارة",
    "deleteMedia": "حذف المقطع",
    "confirmCase": "هل تحذف السجل والمقطع المرتبط به نهائيًا؟",
    "confirmCar": "هل تحذف السيارة وكل سجلاتها ومقاطعها نهائيًا؟",
    "confirmMedia": "هل تحذف المقطع نهائيًا؟",
    "retry": "إعادة المحاولة",
    "carNeeded": "أدخل اسم السيارة.",
    "answerFailed": "تعذّر التحليل، حاول مرة ثانية.",
    "startAgain": "ابدأ تحليلًا جديدًا",
    "questions": [
      [
        "متى تسمعه؟",
        [
          "عند التشغيل",
          "أثناء القيادة",
          "عند الفرامل",
          "عند الالتفاف",
          "على المطبات",
          "عند التسارع",
          "غير متأكد"
        ]
      ],
      [
        "وش نوع الصوت؟",
        [
          "طقطقة",
          "صرير",
          "صفير",
          "حكة / احتكاك",
          "ونة",
          "رجّة / اهتزاز",
          "غير متأكد"
        ]
      ],
      [
        "من وين يجي؟",
        [
          "أمام السيارة",
          "خلف السيارة",
          "من جهة الإطارات",
          "من المحرك",
          "غير متأكد"
        ]
      ],
      [
        "كم يتكرر؟",
        [
          "كل مرة",
          "أحيانًا",
          "بدأ اليوم",
          "غير متأكد"
        ]
      ]
    ],
    "examples": {
      "brakes": "أسمع صرير عالي لما أضغط على الفرامل",
      "starting": "فيه طقطقة أول ما أشغل السيارة الصباح",
      "driving": "أسمع ونة تزيد كل ما زادت سرعة السيارة"
    },
    "deleteAction": "حذف",
    "brandName": "ورشتك",
    "splashTagline": "معك، في كل مشوار.",
    "skipToChat": "انتقل للمحادثة",
    "madeFor": "معك، في كل مشوار.",
    "welcomeNote": "إرشاد يساعدك تفهم، مو تشخيص نهائي.",
    "companionTag": "معك، خطوة بخطوة",
    "exampleHint": "بداية بسيطة لمحادثة مفيدة",
    "brakesHint": "تظهر مع الضغط على الفرامل",
    "startHint": "أول ما أشغّل السيارة",
    "driveHint": "يتغيّر وأنا أمشي",
    "inputLabel": "وصف مشكلة السيارة",
    "composerHint": "اكتبها، سجّلها، أو شاركنا مقطع.",
    "enterHint": "Enter للإرسال · Shift + Enter لسطر جديد",
    "openMenu": "فتح قائمة السيارات",
    "closeMenu": "إغلاق القائمة",
    "changeLanguage": "Switch to English",
    "themeLight": "تفعيل المظهر الفاتح",
    "themeDark": "تفعيل المظهر الداكن",
    "attachLabel": "إرفاق صورة أو صوت أو فيديو",
    "recordLabel": "إملاء كلام إلى مسودة",
    "stopLabel": "إيقاف التسجيل",
    "closeDialog": "إغلاق نافذة إضافة سيارة",
    "workshopHeading": "مساحة لسيارتك. وراحة بالك.",
    "workshopStamp": "ورشتك الرقمية",
    "tipLabel": "نصيحة من الورشة",
    "mechanicTip": "قل لنا متى يظهر الصوت، وش يتغيّر معه. التفاصيل الصغيرة تفرق.",
    "recordingNow": "التسجيل شغّال",
    "recordingHint": "اضغط إيقاف لتحويل كلامك إلى نص، ثم راجعه وأرسله.",
    "dropLabel": "أفلت الملف هنا لإرفاقه",
    "networkError": "ما قدرنا نوصل للسيرفر. تأكد أن التطبيق شغّال وافتحه من عنوانه الصحيح، ثم جرّب إرسال رسالتك مرة ثانية."
  },
  "en": {
    "newAnalysis": "Start a conversation",
    "myCars": "My vehicles",
    "history": "Conversations",
    "localPrivacy": "History stays on this device. Messages go to your provider; attachments upload temporarily on Send.",
    "workspace": "Your garage",
    "aiAssistant": "AI assistant",
    "eyebrow": "WELCOME TO YOUR WORKSHOP",
    "heroTitle": "Your car has a story.<br><span>Let’s understand it.</span>",
    "heroDescription": "A new noise? An unusual shake? Tell us what you notice or share a clip. We’ll explore the possibilities and a sensible next step.",
    "tryExample": "What have you noticed?",
    "exampleBrakes": "My brakes squeal",
    "exampleStart": "Clicking on startup",
    "exampleDrive": "A noise at speed",
    "inputPlaceholder": "Take your time. What’s going on with your car?",
    "attach": "Attach",
    "record": "Dictate",
    "cancelDictation": "Cancel dictation",
    "stop": "Stop",
    "analyze": "Send",
    "analyzing": "Considering your details",
    "disclaimer": "Warshatak explores possibilities, not diagnoses. Consult a qualified mechanic. Attachments upload temporarily on Send.",
    "addVehicle": "Add a vehicle",
    "vehicleName": "Vehicle name",
    "carPlaceholder": "e.g. Camry 2022",
    "cancel": "Cancel",
    "save": "Save",
    "defaultCar": "My car",
    "noHistory": "Your next conversation starts here. We’ll keep it in this space.",
    "question": "Question",
    "of": "of",
    "introMessage": "Four quick questions to narrow it down.",
    "resultIntro": "Here are some possibilities based on your description.",
    "possibleReasons": "Possible causes",
    "nextSteps": "What to do next",
    "urgentSigns": "Important warning signs",
    "resultLabel": "Llama analysis",
    "resultNotice": "Possibilities only. Not a mechanic’s diagnosis.",
    "newCheck": "New analysis",
    "low": "Monitor",
    "medium": "Inspection advised",
    "high": "Urgent attention",
    "required": "Describe the noise using at least 8 characters.",
    "mediaInfo": "Up to 25 MB. Uploads on Send; audio may be sent to Google or Groq depending on analysis/transcription settings. Analysis depends on available capabilities.",
    "fileTooLarge": "Maximum media file size is 25 MB.",
    "fileType": "Choose an image, audio, or video file.",
    "mediaSaved": "Saved media",
    "mediaMissing": "Media unavailable on this device.",
    "recordUnsupported": "Audio recording is not supported by this browser.",
    "recordError": "Cannot access the microphone. Check permissions.",
    "storageError": "Could not save media. Try a smaller file.",
    "localOnly": "Stored on this device only",
    "remove": "Remove",
    "deleteCase": "Delete record",
    "deleteCar": "Delete vehicle",
    "deleteMedia": "Delete media",
    "confirmCase": "Permanently delete this record and its media?",
    "confirmCar": "Permanently delete this vehicle, its history and media?",
    "confirmMedia": "Permanently delete this media?",
    "retry": "Try again",
    "carNeeded": "Enter a vehicle name.",
    "answerFailed": "Analysis failed. Please try again.",
    "startAgain": "Start a new analysis",
    "questions": [
      [
        "When do you hear it?",
        [
          "When starting",
          "While driving",
          "When braking",
          "When turning",
          "Over bumps",
          "When accelerating",
          "Not sure"
        ]
      ],
      [
        "What does it sound like?",
        [
          "Clicking",
          "Squealing",
          "Whistling",
          "Scraping",
          "Humming",
          "Vibration",
          "Not sure"
        ]
      ],
      [
        "Where does it come from?",
        [
          "Front of car",
          "Rear of car",
          "Near wheels",
          "Engine bay",
          "Not sure"
        ]
      ],
      [
        "How often?",
        [
          "Every time",
          "Sometimes",
          "Started today",
          "Not sure"
        ]
      ]
    ],
    "examples": {
      "brakes": "I hear a high-pitched squeal when pressing the brakes.",
      "starting": "There is a clicking noise when I start the car.",
      "driving": "There is a humming noise that gets louder as I drive faster."
    },
    "deleteAction": "Delete",
    "brandName": "Warshatak",
    "splashTagline": "With you. Every mile.",
    "skipToChat": "Skip to conversation",
    "madeFor": "With you. Every mile.",
    "welcomeNote": "Helpful guidance. Never a final diagnosis.",
    "companionTag": "With you, step by step",
    "exampleHint": "A small starting point. A useful conversation.",
    "brakesHint": "When I press the brakes",
    "startHint": "As I start the engine",
    "driveHint": "It changes as I drive",
    "inputLabel": "Describe your car problem",
    "composerHint": "Write it, record it, or share a clip.",
    "enterHint": "Enter to send · Shift + Enter for a new line",
    "openMenu": "Open vehicle menu",
    "closeMenu": "Close menu",
    "changeLanguage": "التبديل إلى العربية",
    "themeLight": "Use light theme",
    "themeDark": "Use dark theme",
    "attachLabel": "Attach a photo, audio or video",
    "recordLabel": "Dictate text to draft",
    "stopLabel": "Stop recording",
    "closeDialog": "Close add vehicle dialog",
    "workshopHeading": "A space for your car. A little peace of mind.",
    "workshopStamp": "YOUR DIGITAL WORKSHOP",
    "tipLabel": "A tip from the workshop",
    "mechanicTip": "Tell us when it happens and what changes it. Small details make a difference.",
    "recordingNow": "Recording is on",
    "recordingHint": "Stop to transcribe, then review and send.",
    "dropLabel": "Drop your file here to attach",
    "networkError": "We couldn’t reach the app server. Make sure it is running and open the app at its server address, then try sending again."
  }
};
function icon(name) {
 const node=document.createElementNS('http://www.w3.org/2000/svg','svg');
 node.classList.add('icon');node.setAttribute('aria-hidden','true');
 const use=document.createElementNS('http://www.w3.org/2000/svg','use');
 use.setAttribute('href','/assets/icons.svg#'+name);node.append(use);return node;
}
const optionKeys=['timing','sound','location','frequency'];
const STORAGE_KEY='carnoise-garage-v2';
const makeId=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
function loadState(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(data&&Array.isArray(data.cars)&&data.cars.length)return {cars:data.cars,cases:Array.isArray(data.cases)?data.cases:[],carId:data.carId||data.cars[0].id,lang:data.lang==='en'?'en':'ar',theme:data.theme==='light'?'light':'dark'};}catch{}const car={id:makeId(),nameAr:'سيارتي',nameEn:'My car'};return {cars:[car],cases:[],carId:car.id,lang:'ar',theme:'dark'};}
const state=loadState();
let session=null,questionIndex=0,submitting=false,pendingMedia=null,pendingUrl=null,recording=null,mediaStream=null,mediaChunks=[],recorder=null;
let mediaRenderVersion=0;
let visibleThreadId=null,visibleMessageCount=0;
let recordingStartedAt=0,recordingClock=null;
let loadingTimer=null;
const t=k=>translations[state.lang][k],qList=()=>translations[state.lang].questions;
let cinematicIntro=null;
let dictationController=null,dictationStopTimer=null,dictationStarting=false;
let speechState='idle',editingCarId=null,editingCaseId=null,requestController=null,recordingGeneration=0,successUntil=0,successTimer=null;
const recordingMeter=createRecordingMeter({onLevel:value=>{$('recordingStatus').style.setProperty('--recording-level',String(value));},onUnavailable:()=>{$('recordingMeter').dataset.unavailable='true';}});
const voice=createVoice({container:$('voicePanel'),getLanguage:()=>state.lang,canSpeak:()=>!recording,onNotice:message=>{if(message)$('garageSettings').open=true;$('speechNotice').textContent=message;$('speechNotice').classList.toggle('hidden',!message);},onMouth:value=>document.body.style.setProperty('--mouth-open',String(value)),onState:value=>{if(value==='loading'||value==='speaking')stopMediaPlayback();speechState=value;document.body.dataset.speechState=value;syncMechanicState();}});

const replyDelivery=createReplyDelivery({onRelease:entry=>{if(session?.id===entry.caseId)renderSession();},onSlow:()=>{voice.stop();$('speechNotice').textContent=state.lang==='ar'?'الرد جاهز، لكن الصوت تأخر. عرضنا النص؛ تقدر تشغّل القراءة يدويًا.':'The reply is ready, but speech took too long. Text is shown; you can play it manually.';$('speechNotice').classList.remove('hidden');}});

const textNode=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{showError(t('storageError'));}}
function showError(message){
 $('errorBox').replaceChildren();
 if(message){
  const mascot=document.createElementNS('http://www.w3.org/2000/svg','svg');
  mascot.setAttribute('viewBox','0 0 380 360');mascot.setAttribute('aria-hidden','true');mascot.classList.add('mechanic','mechanic-small');
  const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','/assets/mechanic.svg#error');mascot.append(use);
  $('errorBox').append(mascot,textNode('span',message,'error-copy'));
  if($('description').value.trim()){const retry=textNode('button',state.lang==='ar'?'إعادة المحاولة':'Retry','retry-button');retry.type='button';retry.onclick=()=>{if(!submitting)$('composer').requestSubmit();};$('errorBox').append(retry);}
 }
 $('errorBox').classList.toggle('hidden',!message);
}
function carName(car){return car.name||(state.lang==='ar'?car.nameAr:car.nameEn)||t('defaultCar');}
function selectedCar(){return state.cars.find(c=>c.id===state.carId)||state.cars[0];}
function dateLabel(iso){return new Date(iso).toLocaleDateString(state.lang==='ar'?'ar-SA':'en-US',{day:'numeric',month:'short'});}
function renderSidebar(){
 $('carList').replaceChildren();$('historyList').replaceChildren();
 $('currentCarName').textContent=carName(selectedCar());
 const select=document.createElement('select');select.id='vehicleSelect';select.className='vehicle-select';select.setAttribute('aria-label',state.lang==='ar'?'السيارة الحالية':'Current vehicle');
 for(const car of state.cars)select.add(new Option(carName(car)+(car.year?' · '+car.year:''),car.id));
 select.value=selectedCar().id;select.title=carName(selectedCar());
 select.onchange=()=>{state.carId=select.value;$('historySearch').value='';persist();newAnalysis();closeNav();};
 for(const car of [selectedCar()]){
  const row=textNode('div','','vehicle-item');
  const symbol=textNode('span','','car-symbol');symbol.append(icon('car'));
  const menu=document.createElement('details');menu.className='vehicle-menu';const toggle=textNode('summary','⋯');toggle.setAttribute('aria-label',(state.lang==='ar'?'خيارات ':'Options for ')+carName(car));menu.append(toggle);
  const actions=textNode('div','','vehicle-actions');
  const rename=textNode('button',state.lang==='ar'?'تعديل الاسم':'Rename');rename.type='button';rename.onclick=()=>{editingCaseId=null;editingCarId=car.id;$('carDialogTitle').textContent=state.lang==='ar'?'تعديل اسم السيارة':'Rename vehicle';document.querySelector('label[for="carName"]').textContent=t('vehicleName');$('carName').value=carName(car);menu.open=false;$('carDialog').showModal();};
  const del=textNode('button',t('deleteCar'));del.type='button';del.onclick=()=>{menu.open=false;deleteVehicle(car.id);};actions.append(rename,del);menu.append(actions);row.append(symbol,select,menu);$('carList').append(row);
 }
 $('historySearchLabel').textContent=state.lang==='ar'?'ابحث في محادثات السيارة':'Search this vehicle’s conversations';
 $('historySearch').placeholder=state.lang==='ar'?'ابحث في المحادثات…':'Search conversations…';
 renderHistory();
}
function renderHistory(){
 $('historyList').replaceChildren();
 const history=filterCases(state.cases,state.carId,$('historySearch').value,state.lang);
 if(!history.length)$('historyList').append(textNode('div',$('historySearch').value?(state.lang==='ar'?'ما فيه محادثة تطابق بحثك.':'No conversations match your search.'):t('noHistory'),'empty-side'));
 for(const entry of history){
  const button=document.createElement('button');button.type='button';button.className='history-row'+(session?.id===entry.id?' active':'');
  button.title=caseTitle(entry,state.lang);if(session?.id===entry.id)button.setAttribute('aria-current','true');
  button.append(textNode('span',caseTitle(entry,state.lang),'history-name'),textNode('span',dateLabel(entry.createdAt),'history-date'));
  button.addEventListener('click',()=>{loadCase(entry);closeNav();});
  const row=textNode('div','','history-item');row.append(button);
  const menu=document.createElement('details');menu.className='thread-menu';const toggle=textNode('summary','⋯');toggle.setAttribute('aria-label',(state.lang==='ar'?'خيارات المحادثة: ':'Conversation options: ')+caseTitle(entry,state.lang));menu.append(toggle);
  const actions=textNode('div','','thread-actions');
  const rename=textNode('button',state.lang==='ar'?'تعديل العنوان':'Rename');rename.type='button';rename.onclick=()=>{editingCarId=null;editingCaseId=entry.id;$('carDialogTitle').textContent=state.lang==='ar'?'عنوان المحادثة':'Conversation title';document.querySelector('label[for="carName"]').textContent=state.lang==='ar'?'العنوان':'Title';$('carName').value=caseTitle(entry,state.lang);menu.open=false;$('carDialog').showModal();};
  const del=textNode('button',t('deleteCase'));del.type='button';del.onclick=()=>{menu.open=false;deleteCase(entry.id);};actions.append(rename,del);menu.append(actions);row.append(menu);$('historyList').append(row);
 }
}
function applySettings(){
 cinematicIntro?.setLanguage(state.lang);
 voice.stop();voice.render();
 const root=document.documentElement,themeChanged=root.dataset.theme!==state.theme;
 // Cross-fading opposite text/background palettes briefly loses contrast.
 if(themeChanged)root.classList.add('theme-switching');
 root.lang=state.lang;root.dir=state.lang==='ar'?'rtl':'ltr';root.dataset.theme=state.theme;
 if(themeChanged)requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('theme-switching')));
 document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
 document.querySelectorAll('[data-i18n-html]').forEach(n=>{const key=n.dataset.i18nHtml;if(key==='heroTitle')n.innerHTML=t(key);});
 document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>n.placeholder=t(n.dataset.i18nPlaceholder));
 document.querySelector('[data-brand="warshatak"]').textContent=t('brandName');
 document.title=state.lang==='ar'?'ورشتك | مساعد سيارتك':'Warshatak | Your Car Companion';
 $('garageSettingsTitle').textContent=state.lang==='ar'?'الإعدادات':'Settings';
 $('languageSwitch').textContent=state.lang==='ar'?'EN':'عربي';
 $('themeSwitch').replaceChildren(icon(state.theme==='dark'?'sun':'moon'));
 document.querySelector('meta[name="theme-color"]').content=state.theme==='dark'?'#141e1e':'#f5f3ec';
 const labels={menuButton:'openMenu',closeSidebar:'closeMenu',languageSwitch:'changeLanguage',themeSwitch:state.theme==='dark'?'themeLight':'themeDark',addCar:'addVehicle',attachButton:'attachLabel',recordButton:recording?'stopLabel':'recordLabel',cancelCar:'closeDialog'};
 for(const [id,key] of Object.entries(labels)){ $(id).setAttribute('aria-label',t(key));$(id).title=t(key); }
 $('recordButton').querySelector('span').textContent=recording?t('stop'):t('record');
 $('typingLabel').textContent=t('analyzing');
 renderSidebar();
 if(session)renderSession();
 syncMechanicState();
}
function addMessage(message,role,messageData=null){
 const waiting=role==='assistant'&&replyDelivery.isPending(messageData);
 const wrap=textNode('div','','message '+role);
 const content=textNode('div',waiting?(state.lang==='ar'?'الرد جاهز، نجهّز صوته…':'Reply ready; preparing its speech…'):message);
 if(waiting){content.setAttribute('role','status');wrap.classList.add('speech-pending');}
 if(!waiting&&role==='assistant'&&messageData?.resultCard){const card=renderSoundResult(messageData.resultCard,session?.lang||state.lang);if(card)content.replaceChildren(card);}
 content.setAttribute('dir','auto');
 content.style.textAlign='start';
 wrap.append(textNode('div',role==='user'?(state.lang==='ar'?'أنت':'You'):'ورشتك | Warshatak','message-label'),content);
 if(role==='assistant'&&!waiting)wrap.append(voice.readButton(message));
 if(waiting){const reveal=textNode('button',state.lang==='ar'?'عرض النص الآن':'Show text now','show-reply-now');reveal.type='button';reveal.onclick=()=>{replyDelivery.release(messageData);voice.stop();};wrap.append(reveal);}
 $('messages').append(wrap);
}
function stopMediaPlayback(){document.querySelectorAll('audio,video').forEach(media=>media.pause());}
document.addEventListener('play',event=>{if(!(event.target instanceof HTMLMediaElement))return;if(recording){event.target.pause();return;}voice.stop();document.querySelectorAll('audio,video').forEach(media=>{if(media!==event.target)media.pause();});},true);
function newAnalysis(){
 stopMediaPlayback();
 successUntil=0;clearTimeout(successTimer);
 discardRecording();voice.stop();requestController?.abort();requestController=null;
 visibleThreadId=null;visibleMessageCount=0;
 session=null;questionIndex=0;submitting=false;$('attachButton').disabled=false;$('recordButton').disabled=false;$('intro').classList.remove('hidden');$('conversation').classList.add('hidden');$('questionBox').classList.add('hidden');$('resultBox').classList.add('hidden');$('busy').classList.add('hidden');$('messages').replaceChildren();$('description').disabled=false;$('sendButton').disabled=false;$('description').value='';showError('');clearPendingMedia();renderSidebar();
}
function createCase(description){
 const entry={id:makeId(),carId:state.carId,createdAt:new Date().toISOString(),description,lang:state.lang,answers:[],messages:[],result:null,mediaId:null,mediaType:null,mediaName:null,mediaAttempted:false};
 state.cases.push(entry);session=entry;questionIndex=0;persist();renderSidebar();return entry;
}
async function startAnalysis(description){
 if(recording||dictationController||dictationStarting)return;
 description=String(description||'').trim();
 if(description.length<2&&pendingMedia){
  description=state.lang==='ar'?'حلل المرفق واذكر ما تستطيع ملاحظته مع حدود التحليل.':'Analyze the attachment and explain only observations and limitations.';
 }
 if(description.length<2){showError(state.lang==='ar'?'اكتب وصف بسيط عن المشكلة أو أرفق ملف.':'Describe the issue or attach a media file.');$('description').focus();return;}
 if(session){await sendChat(description);return;}
 showError('');
 createCase(description.trim());
 await sendChat(description.trim());
}

async function sendChat(text,{audioInterviewAnswer=null,skipClarification=false}={}){
 if(submitting||recording||dictationController||dictationStarting||!session)return;
 const turnStarted=performance.now();
 stopMediaPlayback();voice.stop();const controller=new AbortController();requestController=controller;const deadline=setTimeout(()=>controller.abort(),120000);
 const message=String(text||'').trim();
 if(message.length<2){clearTimeout(deadline);showError(state.lang==='ar'?'اكتب رسالة أطول شوي.':'Please write a longer message.');return;}
 const active=session;submitting=true;
 if(pendingMedia){
  try{
   const id=makeId();
   await saveBlob(id,pendingMedia);
   active.mediaId=id;active.mediaType=pendingMedia.type;active.mediaName=pendingMedia.name;
   active.mediaAttempted=false;active.mediaAnalysis=null;active.mediaAnalysisError=null;
   persist();clearPendingMedia();
  }catch(error){clearTimeout(deadline);requestController=null;submitting=false;showError(t('storageError'));return;}
 }
 if(controller.signal.aborted){clearTimeout(deadline);return;}
 if(!Array.isArray(active.messages))active.messages=[];
 const allPrior=active.messages.map(({role,content})=>({role,content}));
 const prior=allPrior.length>10
  ? [allPrior.find(x=>x.role==='user'),...allPrior.slice(-10)].filter(Boolean)
  : allPrior;
 const boundedPrior=prior.map(({role,content})=>({role,content:String(content||'').slice(0,650)}));
 active.messages.push({role:'user',content:message});
 active.description=active.description||message;
 persist();
 $('description').value='';
 showError('');submitting=true;setLoading('reply');renderSession();$('busy').classList.remove('hidden');$('sendButton').disabled=true;
 const vehicleHistory=state.cases.filter(x=>x.carId===active.carId&&x.id!==active.id&&(x.result||x.messages?.some(m=>m.role==='assistant'))).slice(-5)
  .map(x=>({date:x.createdAt.slice(0,10),description:x.description.slice(0,200),suspectedSummary:String(x.result?.summary||x.problemSummary?.assessment||x.messages?.findLast(m=>m.role==='assistant')?.content||'').slice(0,200)}));
 try{
  let mediaInsight=null,mediaRequestedThisTurn=false;
  if(active.mediaId && !active.mediaAttempted){
   mediaRequestedThisTurn=true;active.mediaAttempted=true;
   try{
    const mediaFile=await readBlob(active.mediaId);
    if(mediaFile){
     const payload=new FormData();
     payload.append('media',mediaFile,active.mediaName||'recording');
     payload.append('language',state.lang);
     setLoading('media');
     const analysisResponse=await uploadMedia(payload,{signal:controller.signal,onProgress:({percent})=>{if(requestController===controller)setLoading('media',percent);},onUploaded:()=>{if(requestController===controller)setLoading('analysis');}});
     const parsed=analysisResponse.body;
     if(!analysisResponse.ok||!parsed.analysis)throw Error(parsed.error||'Media model unavailable');
     mediaInsight=parsed.analysis;
     active.mediaAnalysis=mediaInsight;active.mediaAnalysisError=null;
     persist();
    }
   }catch(err){
    active.mediaAttempted=false;active.mediaAnalysisError=String(err.message||err).slice(0,240);
    persist();
    if(session?.id===active.id)showError((state.lang==='ar'?'تعذر تحليل المقطع، لكن بجاوب على وصفك النصي: ':'Could not analyze media; responding to text only: ')+active.mediaAnalysisError);
   }
  }
  if(controller.signal.aborted)throw new DOMException('Request cancelled or timed out.','AbortError');
  setLoading('reply');
  const response=await fetch('/api/chat',{signal:controller.signal,method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({message,resultFormat:'compact',mediaAttachedThisTurn:mediaRequestedThisTurn,language:audioInterviewAnswer?(active.lang||state.lang):state.lang,messages:boundedPrior,questionMemory:summarizeQuestionMemory(allPrior),vehicle:{name:carName(selectedCar()),year:selectedCar()?.year||null},vehicleHistory,mediaInsight:mediaInsight||active.mediaAnalysis||null,mediaFailure:active.mediaAnalysisError||null,audioInterviewAnswer,skipClarification,offeredReferenceIds:active.messages.filter(m=>m.referenceExample).map(m=>m.referenceExample.id).slice(-100)})});
  let data;try{data=await response.json();}catch{throw Error(t('answerFailed'));}
  if(!response.ok||typeof data.reply!=='string')throw Error(data.error||t('answerFailed'));
  if(['ar','en'].includes(data.responseLanguage))active.lang=data.responseLanguage;
  active.evidenceConflicts=Array.isArray(data.evidenceConflicts)?data.evidenceConflicts:[];
  active.problemSummary=data.problemSummary||null;active.timings={chat:data.timings||null,media:active.mediaAnalysis?.timings||null};
  if(data.audioStatus==='classifier-error'&&data.audioError){
   if(active.mediaAnalysis?.audioEventAnalysis?.provider==='gemini')showError((state.lang==='ar'?'تعذر تحليل الصوت عبر Gemini: ':'Gemini audio analysis failed: ')+String(data.audioError).slice(0,240));
   else showError((state.lang==='ar'?'فشل مودل CLAP: ':'CLAP failed: ')+String(data.audioError).slice(0,170));
  }
  if(!state.cases.some(x=>x.id===active.id))return;
  active.messages.push({role:'assistant',content:data.reply.slice(0,1900),resultCard:data.resultCard||null,referenceExample:data.referenceExample||null,canSkipQuestion:data.canSkipQuestion===true,clarificationOptions:Array.isArray(data.clarificationOptions)?data.clarificationOptions.slice(0,10).filter(x=>typeof x.label==='string'&&typeof x.text==='string'):[],audioInterview:data.audioInterview&&typeof data.audioInterview==='object'?data.audioInterview:null,sources:['publisher-knowledge-card','language-model-with-retrieval'].includes(data.grounding)&&Array.isArray(data.knowledgeMatches)?data.knowledgeMatches.slice(0,2).filter(x=>typeof x.source_url==='string'&&x.source_url.startsWith('https://')).map(x=>({url:x.source_url,label:active.lang==='en'?x.symptom_en:x.symptom_ar})):[]});
  const spokenMessage=active.messages.at(-1);
  const syncSpeech=session?.id===active.id&&voice.isAutoEnabled()&&data.problemSummary?.urgent!==true&&data.resultCard?.status!=='known_recording';
  if(syncSpeech)replyDelivery.prepare(spokenMessage,active.id);
  persist();
  if(session?.id===active.id){successUntil=performance.now()+1300;clearTimeout(successTimer);successTimer=setTimeout(syncMechanicState,1400);renderSidebar();renderSession();if(data.resultCard?.status!=='known_recording')voice.autoSpeak(data.reply,{turnStarted,onStart:()=>replyDelivery.release(spokenMessage),onStop:()=>replyDelivery.release(spokenMessage)});}
 }catch(error){
  if(state.cases.some(x=>x.id===active.id)){
   // Remove only the failed user turn so it can be retried without duplicated chat context.
   let index=-1;for(let i=active.messages.length-1;i>=0;i--){if(active.messages[i].role==='user'&&active.messages[i].content===message){index=i;break;}}
   if(index>=0)active.messages.splice(index,1);
   persist();
  }
  if(session?.id===active.id){
   $('description').value=message;
   renderSession();
   showError(controller.signal.aborted?(state.lang==='ar'?'تم إلغاء الطلب أو انتهت مهلة الانتظار. تقدر تحاول مرة ثانية.':'Request cancelled or timed out. You can try again.'):error instanceof TypeError&&/fetch|network/i.test(error.message)?t('networkError'):error.message||t('answerFailed'));
  }
 }finally{
  clearTimeout(deadline);
  if(requestController!==controller)return;
  clearTimeout(loadingTimer);
  requestController=null;
  submitting=false;$('busy').classList.add('hidden');
  $('sendButton').disabled=false;
  $('description').disabled=false;
  // renderSession() ran while submitting=true and disabled these controls.
  // Always restore them when the chat request completes, including errors.
  $('attachButton').disabled=false;
  $('recordButton').disabled=false;
  // Choices rendered during the request were initially disabled. Refresh once
  // the response completes so only the latest choices become interactive.
  if(session?.id===active.id && (active.messages.at(-1)?.clarificationOptions?.length||active.messages.at(-1)?.canSkipQuestion))renderSession();
  else if(session?.id===active.id&&active.messages.at(-1)?.referenceExample)renderSession();
 }
}

function renderAudioClarifications(message,isLatest){
 if(!Array.isArray(message.clarificationOptions)||!message.clarificationOptions.length)return;
 const wrap=textNode('div','','audio-clarification-choices');
 const title=textNode('div',state.lang==='ar'?'اختر الأقرب لوصفك، مو تشخيص:':'Choose the closest description (not a diagnosis):','audio-clarification-title');
 wrap.append(title);
 for(const choice of message.clarificationOptions.slice(0,10)){
  if(typeof choice.label!=='string'||typeof choice.text!=='string'||choice.text.length>250)continue;
  const button=textNode('button',choice.label,'audio-clarification-choice');
  button.type='button';button.disabled=!isLatest||submitting;
  button.addEventListener('click',()=>{
   if(!session||submitting)return;
   const interview=message.audioInterview;
   if(interview&&typeof choice.stage==='string'&&typeof choice.value==='string'){
    // The user explicitly chooses the answer; never claim the model heard it.
    void sendChat(choice.text,{audioInterviewAnswer:{
     stage:choice.stage,value:choice.value,answers:interview.answers||{}
    }});
   }else{
    $('description').value=choice.text;
    $('composer').requestSubmit();
   }
  });
  wrap.append(button);
 }
 $('messages').append(wrap);
}
function renderProblemSummary(){
 if(session?.messages?.at(-1)?.resultCard)return;
 const summary=buildProblemSummary(session,state.lang);if(!summary)return;
 summary.vehicle=carName(selectedCar());
 const card=document.createElement('details');card.className='problem-summary';
 const heading=textNode('summary',state.lang==='ar'?'ملخص تاخذه معك للفني':'A summary to take to your mechanic');card.append(heading);
 const body=textNode('div','','problem-summary-body');
 const ar=state.lang==='ar';
 const sections=[
  [ar?'وصفك للمشكلة':'Your symptom notes',summary.symptoms.length?summary.symptoms.join(' / '):(ar?'ما عندنا وصف محدد حتى الآن.':'No specific symptom notes yet.')],
  [ar?'تقييم المساعد — احتمالات':'Assistant assessment — possibilities',summary.assessment],
  [ar?'ملاحظات النموذج الصوتية — قد تخطئ':'Model sound observations — may be wrong',summary.evidence.join(' / ')||(ar?'غير متوفرة.':'Unavailable.')],
  [ar?'ما لم يتأكد':'What remains uncertain',summary.uncertainty.join(' ')],
  [ar?'نتائج ميكانيكية مؤكدة':'Confirmed mechanical findings',ar?'لا يوجد فحص موثق.':'No documented inspection.'],
  [ar?'الخطوة الآمنة':'Safe next step',summary.nextStep]
 ];
 for(const [title,text] of sections){body.append(textNode('h3',title),textNode('p',text));}
 if(summary.urgent)body.append(textNode('p',ar?'ظهرت أعراض خطر في وصفك؛ توقف بأمان واطلب المساعدة.':'Danger signs were reported; stop safely and get assistance.','summary-urgent'));
 const copy=textNode('button',ar?'نسخ الملخص':'Copy summary','summary-copy');copy.type='button';
 const status=textNode('span','','summary-copy-status');status.setAttribute('role','status');
 copy.onclick=async()=>{
  const text=summaryText(summary,state.lang);
  try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
   await navigator.clipboard.writeText(text);status.textContent=ar?'تم النسخ':'Copied';
  }catch{
   // Selectable text remains available on insecure/clipboard-blocked browsers.
   let fallback=body.querySelector('textarea');if(!fallback){fallback=document.createElement('textarea');fallback.readOnly=true;fallback.rows=8;fallback.setAttribute('aria-label',ar?'انسخ الملخص يدويًا':'Copy summary manually');body.append(fallback);}fallback.value=text;fallback.focus();fallback.select();status.textContent=ar?'حدد النص وانسخه يدويًا':'Select the text and copy it manually';
  }
 };
 body.append(copy,status);card.append(body);$('messages').append(card);
}
function renderSession(){
 ++mediaRenderVersion;
 if(!session)return;
 if(Array.isArray(session.messages)){
  $('intro').classList.add('hidden');$('conversation').classList.remove('hidden');
  $('messages').replaceChildren();$('resultBox').replaceChildren();
  $('questionBox').classList.add('hidden');$('resultBox').classList.add('hidden');
  const previousCount=visibleThreadId===session.id?visibleMessageCount:0;
  for(const [index,msg] of session.messages.entries()){
   addMessage(msg.content,msg.role,msg);
   if(index<previousCount)$('messages').lastElementChild.classList.add('message-settled');
   if(replyDelivery.isPending(msg))continue;
   if(msg.role==='assistant'&&!msg.resultCard&&msg.referenceExample){
    const card=renderReferenceExample({message:msg,language:session.lang||state.lang,enabled:index===session.messages.length-1&&!submitting,onFeedback:(value,text)=>{if(submitting||msg.referenceFeedback)return;msg.referenceFeedback=value;persist();void sendChat(text,{skipClarification:value==='skip'});}});
    if(card)$('messages').append(card);
   }

   if(msg.role==='assistant'&&Array.isArray(msg.clarificationOptions)){
    renderAudioClarifications(msg,index===session.messages.length-1);
   }
   if(msg.role==='assistant'&&index===session.messages.length-1&&(msg.canSkipQuestion||msg.audioInterview&&msg.audioInterview.stage!=='optin')){
    const skip=textNode('button',state.lang==='ar'?'تخطي السؤال وعرض المتاح':'Skip question and summarize','skip-question');skip.type='button';skip.disabled=submitting;
    skip.onclick=()=>sendChat(state.lang==='ar'?'تخطّ السؤال ولخّص الاحتمالات بما تعرفه الآن دون أسئلة إضافية.':'Skip this question and summarize the possibilities using what is known, without more questions.',{skipClarification:true});$('messages').append(skip);
   }
   if(msg.role==='assistant'&&!msg.resultCard&&Array.isArray(msg.sources)&&msg.sources.length){
    const cited=textNode('div',state.lang==='ar'?'مصادر إرشادية: ':'Reference sources: ','message-sources');
    for(const s of msg.sources){
     if(typeof s.url!=='string'||!s.url.startsWith('https://'))continue;
     const link=textNode('a',String(s.label||'Reference').slice(0,65),'message-source-link');
     link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';cited.append(link);
    }
    $('messages').append(cited);
   }
  }
  visibleThreadId=session.id;visibleMessageCount=session.messages.length;
  if(session.mediaId)showSavedMedia(session.mediaId,session.mediaType,session.mediaName);
  if(session.mediaAnalysisError&&!session.messages.at(-1)?.resultCard)$('messages').append(textNode('div',(state.lang==='ar'?'تنبيه: المقطع محفوظ، لكن لم يتم تحليله: ':'Notice: saved media was not analyzed: ')+session.mediaAnalysisError,'media-warning'));
  if(session.mediaAnalysis&&!session.messages.at(-1)?.resultCard)$('messages').append(textNode('div',state.lang==='ar'?'المرفق محفوظ. ملاحظات النماذج قد تخطئ، وقياسات الصوت الأولية لا تحدد نوعه أو العطل.':'Attachment saved. Model observations may be wrong; waveform metrics alone identify neither the sound nor a fault.','media-warning'));
  if(!replyDelivery.isPending(session.messages.at(-1)))renderProblemSummary();
  $('description').disabled=false;$('sendButton').disabled=Boolean(submitting);
  $('attachButton').disabled=Boolean(submitting);$('recordButton').disabled=Boolean(submitting);
  const latestCard=session.messages.at(-1)?.resultCard?Array.from($('messages').querySelectorAll('.sound-result')).at(-1):null;
  (latestCard||$('messages').lastElementChild)?.scrollIntoView?.({block:latestCard?'start':'nearest'});
  return;
 }
 $('attachButton').disabled=false;$('recordButton').disabled=false;
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
 const activeCase=session;
 submitting=true;showError('');$('busy').classList.remove('hidden');
 const previous=state.cases.filter(c=>c.carId===session.carId&&c.id!==session.id&&c.result).slice(-5).map(c=>({date:c.createdAt.slice(0,10),description:c.description.slice(0,250),suspectedSummary:String(c.result.summary||'').slice(0,250)}));
 const body={description:session.description,language:session.lang||'ar',history:previous};
 for(let i=0;i<4;i++)body[optionKeys[i]]=session.answers[i];
 try{
  const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let data;try{data=await response.json();}catch{throw Error(t('answerFailed'));}
  if(!response.ok)throw Error(data.error||t('answerFailed'));
  if(!data.result||!Array.isArray(data.result.reasons))throw Error(t('answerFailed'));
  if(!state.cases.some(c=>c.id===activeCase.id))return;
  activeCase.result=data.result;persist();
  if(session?.id===activeCase.id){$('questionBox').classList.add('hidden');renderResult(data.result);}
 }catch(e){showError(e.message||t('answerFailed'));const retry=textNode('button',t('retry'),'retry');retry.type='button';retry.addEventListener('click',analyze);$('errorBox').append(document.createElement('br'),retry);}
 finally{submitting=false;$('busy').classList.add('hidden');}
}
function loadCase(entry){stopMediaPlayback();successUntil=0;clearTimeout(successTimer);discardRecording();voice.stop();requestController?.abort();requestController=null;submitting=false;$('busy').classList.add('hidden');visibleThreadId=null;visibleMessageCount=0;clearPendingMedia();session=entry;renderSidebar();showError('');renderSession();}
async function deleteMediaBlob(id){
 const db=await openDb();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 finally{db.close();}
}
function closeWorkshopDialog(dialog,value=''){
 if(!dialog.open||dialog.dataset.closing)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!dialog.animate){dialog.close(value);return;}
 dialog.dataset.closing='true';
 const motion=dialog.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],{duration:140,easing:'ease-in'});
 motion.finished.catch(()=>{}).then(()=>{dialog.close(value);delete dialog.dataset.closing;});
}
function confirmDeletion(message,title){
 const dialog=$('confirmDialog');
 $('confirmTitle').textContent=title;$('confirmDescription').textContent=message;
 dialog.returnValue='cancel';
 return new Promise(resolve=>{
  dialog.addEventListener('close',()=>resolve(dialog.returnValue==='delete'),{once:true});
  dialog.showModal();
 });
}
async function deleteCase(id){
 const entry=state.cases.find(c=>c.id===id);
 if(!entry||!await confirmDeletion(t('confirmCase'),t('deleteCase')))return;
 if(entry.mediaId){try{await deleteMediaBlob(entry.mediaId);}catch{showError(t('storageError'));return;}}
 state.cases=state.cases.filter(c=>c.id!==id);
 persist();
 if(session?.id===id)newAnalysis();else renderSidebar();
}
async function deleteVehicle(id){
 const car=state.cars.find(c=>c.id===id);
 if(!car||!await confirmDeletion(t('confirmCar'),t('deleteCar')))return;
 const cases=state.cases.filter(c=>c.carId===id);
 try{for(const entry of cases)if(entry.mediaId)await deleteMediaBlob(entry.mediaId);}
 catch{showError(t('storageError'));return;}
 state.cases=state.cases.filter(c=>c.carId!==id);
 state.cars=state.cars.filter(c=>c.id!==id);
 if(!state.cars.length)state.cars.push({id:makeId(),nameAr:'سيارتي',nameEn:'My car'});
 state.carId=state.cars[0].id;
 persist();newAnalysis();closeNav();
}
async function deleteSavedMedia(id){
 const entry=state.cases.find(c=>c.id===id);
 if(!entry?.mediaId||!await confirmDeletion(t('confirmMedia'),t('deleteMedia')))return;
 try{await deleteMediaBlob(entry.mediaId);}catch{showError(t('storageError'));return;}
 entry.mediaId=null;entry.mediaName=null;entry.mediaType=null;
 persist();if(session?.id===entry.id)renderSession();else renderSidebar();
}
function openNav(){$('sidebar').inert=false;$('sidebar').classList.add('open');$('overlay').classList.remove('hidden');$('menuButton').setAttribute('aria-expanded','true');document.querySelector('.workspace').inert=true;$('closeSidebar').focus();}
function closeNav(){const wasOpen=$('sidebar').classList.contains('open');$('sidebar').classList.remove('open');$('overlay').classList.add('hidden');$('menuButton').setAttribute('aria-expanded','false');document.querySelector('.workspace').inert=false;if(wasOpen)$('menuButton').focus();}
function openCarDialog(){editingCarId=null;editingCaseId=null;$('carName').value='';document.querySelector('label[for="carName"]').textContent=t('vehicleName');$('carDialogTitle').textContent=t('addVehicle');$('carDialog').showModal();$('carName').focus();}
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
 const node=document.createElement(file.type.startsWith('image/')?'img':file.type.startsWith('video/')?'video':'audio');
 if(node.tagName==='IMG')node.alt=file.name||t('mediaSaved');
 node.controls=true;node.preload='metadata';node.src=url;node.onended=()=>{};
 area.append(textNode('span',file.name||t('mediaSaved'),'media-name'),node);
 if(pending){const remove=textNode('button','✕','remove-media');remove.type='button';remove.title=t('remove');remove.addEventListener('click',clearPendingMedia);area.append(remove);}
 else node.addEventListener('loadedmetadata',()=>{}, {once:true});
 area.append(textNode('div',t('mediaInfo'),'media-warning'));
 if(!pending)node.addEventListener('emptied',()=>URL.revokeObjectURL(url),{once:true});
}
async function showSavedMedia(id,type,name){
 const requestVersion=mediaRenderVersion;
 const caseId=session?.id;
 try{
  const f=await readBlob(id);
  // Media loads asynchronously: never append a stale clip from an earlier
  // render, especially when submitting a new chat message.
  if(requestVersion!==mediaRenderVersion||session?.id!==caseId||session?.mediaId!==id||!f)return;
  const box=$('resultBox');
  const target=box.classList.contains('hidden')?$('messages'):box;
  // Only one active preview per thread, even after multiple renders.
  target.querySelectorAll('[data-saved-media-preview]').forEach(node=>node.remove());
  const compact=Boolean(session?.messages?.at(-1)?.resultCard);
  const attached=textNode(compact?'details':'div','','reason saved-media');
  attached.dataset.savedMediaPreview=id;
  attached.append(textNode(compact?'summary':'strong',state.lang==='ar'?'المرفق الأصلي':'Your attachment'),textNode('span',name||t('mediaSaved')));
  const url=URL.createObjectURL(f);
  const media=document.createElement(type?.startsWith('image/')?'img':type?.startsWith('video/')?'video':'audio');
  if(media.tagName==='IMG')media.alt=name||t('mediaSaved');
  media.controls=true;media.preload='metadata';media.src=url;
  media.style.maxWidth='100%';media.style.maxHeight='220px';
  attached.append(media);
  const transcript=session?.mediaAnalysis?.transcription;
  if(transcript?.hasRecognizedSpeech===true&&typeof transcript.text==='string'&&transcript.text.trim()){
   const card=textNode('details','','transcript-card');card.open=true;
   card.append(textNode('summary',state.lang==='ar'?'الكلام المفرّغ — قد يحتوي أخطاء':'Recognized speech — may contain errors'));
   const words=textNode('p',transcript.text.slice(0,1000));words.dir='auto';card.append(words);
   const edit=textNode('button',state.lang==='ar'?'صحّح الكلام أو أضف توضيح':'Correct or clarify','ghost-btn transcript-edit');edit.type='button';
   edit.addEventListener('click',()=>{if(session?.id!==caseId||submitting)return;if(!$('description').value.trim())$('description').value=transcript.text.slice(0,600);$('description').focus();});
   card.append(edit);attached.append(card);
  }
  if(session?.mediaAnalysis){
   attached.append(textNode('p',state.lang==='ar'?'الملف محفوظ. قد يُرسل الصوت إلى مزود التحليل المختار؛ الملاحظات ليست تشخيصًا.':'File saved. Audio may be sent to your selected analysis provider; observations are not diagnoses.','media-warning'));
  }
  const remove=textNode('button',t('deleteMedia'),'media-delete-btn');
  remove.type='button';remove.addEventListener('click',()=>deleteSavedMedia(id));attached.append(remove);
  target.append(attached);
  // Release the blob URL after the preview leaves the document.
  const observer=new MutationObserver(()=>{
   if(!attached.isConnected){URL.revokeObjectURL(url);observer.disconnect();}
  });
  observer.observe(target,{childList:true});
 }catch{showError(t('mediaMissing'));}
}
function mediaFile(file){
 if(!file)return;
 const validation=validateMedia(file);
 if(!validation.ok){showError(t(validation.error==='too-large'?'fileTooLarge':'fileType'));return;}
 pendingMedia=file;showError('');showMedia(file);
}
function discardRecording(){
 dictationStarting=false;clearTimeout(dictationStopTimer);dictationStopTimer=null;dictationController?.abort();dictationController=null;
 $('cancelDictation').classList.add('hidden');$('dictationNotice').textContent='';$('dictationOverflow').classList.add('hidden');$('dictationOverflow').value='';
 recordingMeter.stop();
 recordingGeneration++;
 if(recorder){recorder.onstop=null;recorder.ondataavailable=null;if(recorder.state!=='inactive')recorder.stop();recorder=null;}
 mediaStream?.getTracks().forEach(track=>track.stop());mediaStream=null;recording=false;mediaChunks=[];
 stopRecordingClock();$('recordButton').disabled=false;$('recordButton').classList.remove('recording');$('recordButton').querySelector('span').textContent=t('record');$('recordButton').setAttribute('aria-label',t('recordLabel'));
}
async function transcribeDraft(blob,generation){
 const controller=new AbortController();dictationController=controller;let timedOut=false;
 const timeout=setTimeout(()=>{timedOut=true;controller.abort();},120000);
 $('recordButton').disabled=true;$('sendButton').disabled=true;
 $('dictationNotice').textContent=state.lang==='ar'?'جاري تحويل الكلام إلى نص…':'Transcribing speech…';
 try{
  const payload=new FormData();payload.append('audio',blob,'dictation.webm');
  const response=await fetch('/api/speech/transcribe',{method:'POST',body:payload,signal:controller.signal});
  const body=await response.json();
  if(controller.signal.aborted||generation!==recordingGeneration)return;
  if(!response.ok)throw Error(body.error||'Dictation failed');
  const transcript=body.transcription;
  if(transcript?.hasRecognizedSpeech!==true||typeof transcript.text!=='string'||!transcript.text.trim())throw Error(state.lang==='ar'?'ما فهمت كلامًا واضحًا. جرّب الإملاء مرة ثانية.':'No clear speech recognized. Please dictate again.');
  // Read the CURRENT draft, preserving edits made while ASR was pending.
  const draft=$('description'),combined=draft.value+(draft.value.trim()?'\n':'')+transcript.text.trim();
  if(combined.length>draft.maxLength){$('dictationOverflow').value=transcript.text.trim();$('dictationOverflow').classList.remove('hidden');throw Error(state.lang==='ar'?'المسودة ممتلئة. حافظت عليها وعرضت التفريغ منفصلًا للنسخ.':'Draft is full. It is preserved; the transcript is shown separately to copy.');}
  draft.value=combined;
  draft.focus();$('dictationNotice').textContent=state.lang==='ar'?'تفريغ آلي قابل للخطأ. راجع النص ثم اضغط إرسال؛ لم يُرسل بعد.':'Automatic transcript may contain errors. Review and send; nothing has been sent.';
 }catch(error){if(generation===recordingGeneration&&(!controller.signal.aborted||timedOut))showError(timedOut?(state.lang==='ar'?'انتهت مهلة الإملاء. جرّب مرة ثانية.':'Dictation timed out. Please retry.'):String(error.message||error));}
 finally{
  clearTimeout(timeout);
  if(dictationController===controller){dictationController=null;$('recordButton').disabled=false;$('sendButton').disabled=Boolean(submitting);$('cancelDictation').classList.add('hidden');
   if(controller.signal.aborted)$('dictationNotice').textContent='';}
 }
}
async function recordToggle(){
 stopMediaPlayback();voice.stop();
 if(recorder?.state==='recording'){recorder.stop();return;}
 if(submitting||dictationController)return;
 if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder){showError(t('recordUnsupported'));return;}
 const generation=++recordingGeneration;dictationStarting=true;$('sendButton').disabled=true;$('recordButton').disabled=true;showError('');
 $('cancelDictation').classList.remove('hidden');$('dictationNotice').textContent='';
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if(generation!==recordingGeneration){stream.getTracks().forEach(track=>track.stop());return;}
  mediaStream=stream;
  const captured=new MediaRecorder(stream),chunks=[];let size=0;recorder=captured;
  captured.ondataavailable=e=>{if(e.data?.size){size+=e.data.size;if(size>5*1024*1024){discardRecording();showError(state.lang==='ar'?'التسجيل تجاوز 5 MiB. جرّب كلامًا أقصر.':'Recording exceeds 5 MiB; try a shorter dictation.');return;}chunks.push(e.data);}};
  captured.onerror=()=>{discardRecording();showError(t('recordError'));};
  captured.onstop=()=>{
   clearTimeout(dictationStopTimer);dictationStopTimer=null;recordingMeter.stop();stream.getTracks().forEach(track=>track.stop());
   if(generation!==recordingGeneration)return;
   const blob=new Blob(chunks,{type:captured.mimeType||'audio/webm'});
   mediaStream=null;recorder=null;recording=false;stopRecordingClock();
   $('recordButton').setAttribute('aria-label',t('recordLabel'));$('recordButton').classList.remove('recording');$('recordButton').querySelector('span').textContent=t('record');
   if(blob.size>0)void transcribeDraft(blob,generation);
   else {discardRecording();showError(t('recordError'));}
  };
  captured.start(1000);recording=true;startRecordingClock();
  dictationStopTimer=setTimeout(()=>{if(generation===recordingGeneration&&captured.state==='recording')captured.stop();},60000);
  delete $('recordingMeter').dataset.unavailable;void recordingMeter.start(stream);$('recordButton').setAttribute('aria-label',t('stopLabel'));$('recordButton').classList.add('recording');$('recordButton').querySelector('span').textContent=t('stop');
 }catch{if(generation===recordingGeneration){discardRecording();showError(t('recordError'));}}
 finally{if(generation===recordingGeneration){dictationStarting=false;if(!dictationController)$('recordButton').disabled=false;}}
}
$('addCar').addEventListener('click',openCarDialog);
$('carForm').addEventListener('submit',e=>{
 e.preventDefault();const name=$('carName').value.trim();if(!name)return;
 if(editingCaseId){const entry=state.cases.find(c=>c.id===editingCaseId);if(entry)entry.title=name;editingCaseId=null;persist();closeWorkshopDialog($('carDialog'));renderSidebar();return;}
 if(editingCarId){const car=state.cars.find(c=>c.id===editingCarId);if(car)car.name=name;editingCarId=null;persist();closeWorkshopDialog($('carDialog'));renderSidebar();return;}
 const car={id:makeId(),name};state.cars.push(car);state.carId=car.id;persist();closeWorkshopDialog($('carDialog'));$('carForm').reset();newAnalysis();closeNav();
});
for(const id of ['cancelCar','cancelCarBottom'])$(id).addEventListener('click',()=>$('carDialog').close());
$('languageSwitch').addEventListener('click',()=>{discardRecording();state.lang=state.lang==='ar'?'en':'ar';if(session&&Array.isArray(session.messages))session.lang=state.lang;persist();applySettings();});
$('themeSwitch').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';persist();applySettings();});
$('newCaseSide').addEventListener('click',()=>{newAnalysis();closeNav();});
$('menuButton').addEventListener('click',openNav);
$('closeSidebar').addEventListener('click',closeNav);
$('overlay').addEventListener('click',closeNav);
$('composer').addEventListener('submit',e=>{e.preventDefault();if(!submitting)startAnalysis($('description').value);});
$('description').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('composer').requestSubmit();}});
$('attachButton').addEventListener('click',()=>$('mediaInput').click());
$('mediaInput').accept=MEDIA_ACCEPT;
$('mediaInput').addEventListener('change',e=>mediaFile(e.target.files?.[0]));
$('recordButton').addEventListener('click',recordToggle);
$('historySearch').addEventListener('input',renderHistory);
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{if(!session&&!submitting)startAnalysis(t('examples')[button.dataset.example]);}));
applySettings();

// Attachments use the same validation and upload path, including drag and drop.
let dragDepth=0;
$('composer').addEventListener('dragenter',event=>{event.preventDefault();if(!submitting){dragDepth++;$('composer').classList.add('drag-over');}});
$('composer').addEventListener('dragover',event=>event.preventDefault());
$('composer').addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;$('composer').classList.remove('drag-over');}});
$('composer').addEventListener('drop',event=>{event.preventDefault();dragDepth=0;$('composer').classList.remove('drag-over');if(!submitting)mediaFile(event.dataTransfer?.files?.[0]);});
document.addEventListener('keydown',event=>{
 if(!$('sidebar').classList.contains('open'))return;
 if(event.key==='Escape'){closeNav();return;}
 if(event.key==='Tab'){
  const controls=[...$('sidebar').querySelectorAll('a[href],button:not(:disabled),select,input,summary')].filter(node=>node.getClientRects().length);
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
});
const mobileLayout=matchMedia('(max-width:680px)');
function syncNavigation(){
 if(!mobileLayout.matches&&$('sidebar').classList.contains('open'))closeNav();
 $('sidebar').inert=mobileLayout.matches&&!$('sidebar').classList.contains('open');
}
mobileLayout.addEventListener('change',syncNavigation);
// Keep the off-canvas menu out of the keyboard order while it is closed.
new MutationObserver(syncNavigation).observe($('sidebar'),{attributes:true,attributeFilter:['class']});
syncNavigation();

// The mechanic reflects actual interface state; no inferred audio or diagnostic state.
function syncMechanicState(){
 const pose=recording?'recording':speechState==='speaking'?'speaking':speechState==='loading'?'thinking':!$('errorBox').classList.contains('hidden')?'error':!$('busy').classList.contains('hidden')?'thinking':speechState==='idle'&&performance.now()<successUntil?'success':'welcome';
 document.body.dataset.assistantState=pose;
 const labels=state.lang==='ar'?{welcome:'معك، خطوة بخطوة',speaking:'الميكانيكي يتحدث',thinking:'جاري تجهيز الرد',recording:'أسمعك…',error:'جاهز للمساعدة'}:{welcome:'Here for your next mile',speaking:'Mechanic speaking',thinking:'Preparing your reply',recording:'Listening…',error:'Here to help'};
 document.querySelector('.assistant-dock').setAttribute('aria-label',state.lang==='ar'?'تشغيل صوت الشخصية':'Character speech playback');
 $('dockLabel').textContent=speechState==='paused'?(state.lang==='ar'?'القراءة متوقفة مؤقتًا':'Speech paused'):pose==='success'?(state.lang==='ar'?'الرد جاهز':'Reply ready'):labels[pose];
 $('pauseSpeech').textContent=speechState==='paused'?(state.lang==='ar'?'متابعة':'Resume'):(state.lang==='ar'?'إيقاف مؤقت':'Pause');
 $('stopSpeech').textContent=state.lang==='ar'?'إيقاف':'Stop';
 $('pauseSpeech').disabled=speechState==='loading';
 if(recording){$('sendButton').disabled=true;$('attachButton').disabled=true;}
 document.querySelectorAll('[data-mechanic]').forEach(use=>use.setAttribute('href','/assets/mechanic.svg#'+(pose==='success'?'welcome':pose)));
}
function updateRecordingClock(){
 const seconds=Math.floor((performance.now()-recordingStartedAt)/1000);
 $('recordingDuration').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function startRecordingClock(){
 clearInterval(recordingClock);recordingStartedAt=performance.now();updateRecordingClock();
 recordingClock=setInterval(updateRecordingClock,250);
 $('recordingStatus').classList.remove('hidden');$('sendButton').disabled=true;
 $('recordButton').setAttribute('aria-pressed','true');syncMechanicState();
}
function stopRecordingClock(){
 clearInterval(recordingClock);recordingClock=null;$('recordingStatus').classList.add('hidden');
 $('recordButton').setAttribute('aria-pressed','false');
 $('sendButton').disabled=Boolean(submitting||(session&&!Array.isArray(session.messages)));
 $('attachButton').disabled=Boolean(submitting);syncMechanicState();
}
new MutationObserver(syncMechanicState).observe($('busy'),{attributes:true,attributeFilter:['class']});
new MutationObserver(syncMechanicState).observe($('errorBox'),{attributes:true,attributeFilter:['class']});
syncMechanicState();

// Native dialogs retain focus management; close motion is bounded and optional.
for(const dialog of [$('carDialog'),$('confirmDialog')]){
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeWorkshopDialog(dialog,'cancel');});
}
$('confirmDialog').querySelector('form').addEventListener('submit',event=>{
 event.preventDefault();closeWorkshopDialog($('confirmDialog'),event.submitter?.value||'cancel');
});

function setLoading(phase,percent=null){
 clearTimeout(loadingTimer);
 const ar=state.lang==='ar';
 $('typingLabel').textContent=phase==='media'?(ar?'جاري رفع المرفق…':'Uploading attachment…')+(Number.isFinite(percent)?' '+percent+'%':''):phase==='analysis'?(ar?'وصل المرفق، جاري تحليله…':'Attachment uploaded; analyzing…'):t('analyzing');
 loadingTimer=setTimeout(()=>{if(!$('busy').classList.contains('hidden'))$('typingLabel').textContent=ar?'الطلب ما زال قيد الانتظار. تقدر تلغيه وتحاول مرة ثانية.':'Still waiting for this request. You can cancel and try again.';},15000);
}
$('cancelRequest').onclick=()=>requestController?.abort();
document.addEventListener('click',event=>{document.querySelectorAll('.vehicle-menu[open],.thread-menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.vehicle-menu[open],.thread-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});});

$('pauseSpeech').onclick=()=>voice.togglePause();
$('stopSpeech').onclick=()=>voice.stop();

cinematicIntro=createCinematicIntro({getLanguage:()=>state.lang,onLanguage:language=>{state.lang=language;if(session&&Array.isArray(session.messages))session.lang=language;persist();applySettings();},beforeOpen:()=>{if(submitting||recording){showError(state.lang==='ar'?'أوقف التسجيل أو انتظر اكتمال الرد قبل إعادة المقدمة.':'Stop recording or wait for the reply before replaying the intro.');return false;}voice.stop();closeNav();return true;}});

$('cancelDictation').onclick=()=>discardRecording();
window.addEventListener('pagehide',discardRecording);
