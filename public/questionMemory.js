// Shared bounded case memory. Only user-authored details become remembered facts.
const clean=value=>typeof value==='string'?value.trim().slice(0,2000):'';
const normalize=text=>clean(text).toLowerCase().replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const fields=['timing','texture','location'];
const detailPatterns={
 timing:/فرامل|افرمل|بريك|تشغيل|سلف|واقف|وقوف|مطب|دعس|تسارع|امشي|سرعه|الف |اللف|brak|start|crank|idl|bump|accelerat|driv|speed|turn/i,
 texture:/صرير|صفير|تصفر|طقطق|تكتك|طق|حك|احتكاك|طحن|ونه|طنين|خشخش|رجف|رجه|ترج|يرج|click|tick|clunk|knock|grind|scrap|squeal|hum|rattl|vibrat|shak|shudder/i,
 location:/مكين|محرك|كبوت|كفر|عجل|اطار|تاير|شكمان|عادم|داخل السياره|طبلون|تحت السياره|engine|hood|wheel|tire|tyre|exhaust|underneath|cabin|dashboard/i
};
export function clarificationFields(text){
 const value=normalize(text),found=[];
 if(/متي|اي وقت|اوقات|وقت يصير|when|under what|what time/.test(value))found.push('timing');
 if(/وين|اي جهه|من جهه|من فين|where|which (?:area|part)|from which/.test(value))found.push('location');
 if(/(?:وش|ايش|ما|كيف).{0,30}(?:صوت|توصف)|نوع الصوت|what.{0,25}sound|describe.{0,20}(?:noise|sound)|does it sound/.test(value))found.push('texture');
 return found;
}
export function isClarificationRequest(text){
 return /^(?:هل |متي |وين |كيف |وش (?:نوع|اقرب|الصوت)|ايش (?:نوع|الصوت)|قل لي|قول لي|وضح لي|حدد لي|when\b|where\b|what (?:does|kind|type)|does\b|is it\b|can you\b|could you\b|tell me\b|describe (?:the|your) (?:sound|noise))/i.test(normalize(text));
}
export function summarizeQuestionMemory(messages=[]){
 const turns=Array.isArray(messages)?messages:[];
 const questions=[];const details={};let firstUser='';
 for(const turn of turns){
  const text=clean(turn?.content);if(!text)continue;
  if(turn.role==='user'){
   firstUser=firstUser||text;
   for(const field of fields)if(detailPatterns[field].test(normalize(text)))details[field]=text;
  }else if(turn.role==='assistant'){
   const clauses=text.match(/[^.!؛\n؟?]+[؟?]/g)||[];
   if(!clauses.length){for(const clause of text.split(/[.!؛\n]/))if(isClarificationRequest(clause))clauses.push(clause);}
   questions.push(...clauses.map(x=>x.trim()));
  }
 }
 return {questionsAsked:Math.min(50,questions.length),askedFields:[...new Set(questions.flatMap(clarificationFields))],
  lastQuestions:questions.slice(-4).map(x=>x.slice(0,280)),
  userDetails:[...new Set([firstUser,...Object.values(details)].filter(Boolean))].slice(-4).map(x=>x.slice(0,250))};
}
export function mergeQuestionMemory(messages=[],supplied=null){
 const actual=summarizeQuestionMemory(messages);
 if(!supplied||typeof supplied!=='object')return actual;
 const count=Number.isFinite(supplied.questionsAsked)?Math.min(50,Math.max(0,Math.floor(supplied.questionsAsked))):0;
 return {questionsAsked:Math.max(actual.questionsAsked,count),
  askedFields:[...new Set([...actual.askedFields,...(Array.isArray(supplied.askedFields)?supplied.askedFields.filter(x=>fields.includes(x)):[])])],
  lastQuestions:[...(Array.isArray(supplied.lastQuestions)?supplied.lastQuestions.filter(x=>typeof x==='string').map(x=>x.slice(0,280)):[]),...actual.lastQuestions].slice(-4),
  userDetails:[...new Set([...(Array.isArray(supplied.userDetails)?supplied.userDetails.filter(x=>typeof x==='string').map(x=>x.slice(0,250)):[]),...actual.userDetails])].slice(-6)};
}
