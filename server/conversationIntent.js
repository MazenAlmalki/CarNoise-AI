// Decide whether fault clarification belongs in the current turn at all.
// Car-part names and assistant guesses alone do not establish a user's problem.
const normalize=value=>String(value||'').toLowerCase().normalize('NFKC').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[^\p{L}\p{N}' ]+/gu,' ').replace(/\s+/g,' ').trim();
const vehicleWords=/(?:سيار|مكين|محرك|فرامل|بريك|دركسون|كفر|اطار|عجل|قير|جير|مكيف|سلف|رديتر|شكمان|بطاري|زيت|لمبه|car\b|vehicle\b|engine\b|brake|steer|wheel|tyre|tire|transmission|gearbox|battery|starter|exhaust|air condition|\bac\b)/i;
const symptoms=/(?:صوت|صرير|صفير|تصفر|طقطق|تكتك|اهتزاز|رجف|رجه|ترج|يرج|حك|احتكاك|طحن|ونه|طنين|خشخش|تحتر|حراره|ضعيف|ضعف|تطفي|يطفي|عطل|دخان|تهريب|تسريب|ما (?:تشتغل|يشتغل|يبرد|تمسك|توقف|تدق)|ماتشتغل|مايبرد|نقص زيت|لمبه.{0,16}(?:شغاله|ولعت)|noise|squeal|click|knock|rattl|vibrat|shak|shudder|grind|humming|whining|won'?t start|doesn'?t start|not cooling|not working|don'?t work|doesn'?t work|warning light|overheat|leak|smoke|brake failure)/i;
const experience=/(?:عندي|سيارتي|اسمع|احس|اشعر|الاحظ|لاحظت|تجيني|صار|صارت|طلع|يطلع|اذا|لما|وقت|عند |مع اللف|\bmy\b|\bi hear\b|\bi feel\b|\bi notice\b|is making|makes a|it happens|when |while )/i;
const problemIntro=/(?:عندي (?:مشكله|عطل)|مشكله (?:في |ب)?سيارتي|سيارتي (?:فيها|بها) مشكله|my car has (?:a )?problem|i have (?:a )?(?:car|vehicle) problem)/i;
const information=/(?:^(?:وش|ايش|ما|ماذا).{0,20}(?:يعني|معني|هو |هي |الفرق|وظيفه|فايده)|^(?:اشرح|عرف لي)|^(?:what (?:is|are|does)|how (?:does|do).{0,35}work|explain\b|define\b|tell me about|difference between))/i;
const greeting=/^(?:(?:السلام|سلام) عليكم(?: ورحمه الله(?: وبركاته)?)?|وعليكم السلام(?: ورحمه الله(?: وبركاته)?)?|هلا(?: والله| فيك| بك)?|اهلا(?: وسهلا)?|مرحبا(?: فيك| بك)?|اهلين|صباح الخير|مساء الخير|كيف حالك|كيفك|وش اخبارك|علومك|hi|hello|hey|good morning|good evening|how are you|salam(?: alaikum)?|assalamu alaikum)$/i;
const closing=/^(?:شكرا(?: لك)?|مشكور|يعطيك العافيه|تسلم|الله يعافيك|مع السلامه|thanks(?: a lot)?|thank you|bye|goodbye)$/i;
const followup=/^(?:ما زال|مازال|لسه|للحين|باقي|ايه|ايوه|نعم|لا(?: |$)|بس |لكن |عند |اذا |لما |مع |بدون |تزيد|يزيد|يخف|تخف|زي |مثل |مو |مب |قصدي|اقصد|وش (?:اسوي|الحل|الاحتمالات|السبب|تنصح)|ايش (?:اسوي|الحل)|وش قلت|وبعدين|ما ادري|مدري|مو متاكد|غير متاكد|ما اعرف|still\b|i still\b|yes\b|no\b|it\b|only\b|when\b|also\b|and\b|same\b|like\b|actually\b|i meant|i don'?t know|not sure|i cannot tell|what (?:should i do|next|could it be|did i)|what'?s next)/i;
const mediaRequest=/^(?:حلل (?:المرفق|المقطع|الصوت|التسجيل)|اسمع (?:المقطع|الصوت)|analy[sz]e (?:the )?(?:attachment|clip|recording|audio)|what do you hear)/i;
function reportsProblem(text){
 if(problemIntro.test(text))return vehicleWords.test(text);
 if(!symptoms.test(text))return false;
 if(information.test(text)&&!experience.test(text))return false;
 return experience.test(text)||vehicleWords.test(text)||/^(?:صوت غريب|صرير|صفير|طقطقه|تكتكه|ونه|رجفه|اهتزاز|strange noise|squealing|clicking|rattling|vibration)$/.test(text);
}
export function classifyConversationTurn({current='',messages=[],userDetails=[],mediaRequested=false}={}){
 const text=normalize(current);
 if(reportsProblem(text))return {mode:'problem',clarificationAllowed:true,reason:'user_reported_vehicle_problem'};
 if(greeting.test(text))return {mode:'greeting',clarificationAllowed:false,reason:'greet_without_assuming_a_fault'};
 if(closing.test(text))return {mode:'closing',clarificationAllowed:false,reason:'acknowledge_without_restarting_questions'};
 if(information.test(text))return {mode:vehicleWords.test(text)?'vehicle_question':'general',clarificationAllowed:false,reason:'answer_the_actual_question_first'};
 if(mediaRequested&&mediaRequest.test(text))return {mode:'problem',clarificationAllowed:true,reason:'user_requested_attachment_analysis'};
 const prior=[...(Array.isArray(userDetails)?userDetails:[]),...(Array.isArray(messages)?messages.filter(x=>x?.role==='user').map(x=>x.content):[])].filter(x=>typeof x==='string').map(normalize);
 const hasPriorProblem=prior.some(value=>reportsProblem(value)||mediaRequest.test(value));
 if(hasPriorProblem&&(followup.test(text)||reportsProblem(text)))return {mode:'problem',clarificationAllowed:true,reason:'continuing_user_reported_problem'};
 return {mode:vehicleWords.test(text)?'vehicle_question':'general',clarificationAllowed:false,reason:'no_vehicle_problem_reported'};
}
