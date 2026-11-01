import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '16kb' }));
app.use('/api', rateLimit({ windowMs: 900000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(path.join(root, 'public')));

const choices = {
  timing: ['عند التشغيل','أثناء القيادة','عند الفرامل','عند الالتفاف','على المطبات','عند التسارع','غير متأكد'],
  sound: ['طقطقة','صرير','صفير','حكة / احتكاك','ونة','رجّة / اهتزاز','غير متأكد'],
  location: ['أمام السيارة','خلف السيارة','من جهة الإطارات','من المحرك','غير متأكد'],
  frequency: ['كل مرة','أحيانًا','بدأ اليوم','غير متأكد']
};
const prompt = 'أنت CarNoise AI مساعد سعودي للتوعية بأصوات السيارات. لا تجزم بسبب العطل ولا تدّعِ فحص السيارة أو سماع الصوت. أجب فقط JSON بمفاتيح title, summary, severity (low/medium/high), reasons (مصفوفة عناصر title, explanation), nextSteps (مصفوفة نصوص), urgentSigns (مصفوفة نصوص). اكتب كل النصوص باللغة العربية الواضحة. اذكر 2-3 أسباب محتملة و2-4 خطوات آمنة. عند أعراض خطيرة في المكابح أو التوجيه أو وجود دخان أو رائحة حريق أو فقدان السيطرة، اجعل severity high ونبّه المستخدم للتوقف في مكان آمن وعدم مواصلة القيادة وطلب مساعدة فني مختص. لا تعط تعليمات إصلاح خطرة. النتائج احتمالات وليست تشخيصًا.';
const trim = (v,n=800) => typeof v === 'string' ? v.trim().slice(0,n) : '';
const strings = (v,n=4) => Array.isArray(v) ? v.slice(0,n).map(x=>trim(x,240)).filter(Boolean) : [];
function validateResult(v) {
  if (!v || typeof v !== 'object' || !['low','medium','high'].includes(v.severity)) return null;
  const reasons = Array.isArray(v.reasons) ? v.reasons.slice(0,3).map(r=>({title:trim(r?.title,90),explanation:trim(r?.explanation,300)})).filter(r=>r.title&&r.explanation) : [];
  const nextSteps = strings(v.nextSteps);
  if (!trim(v.title,120) || !trim(v.summary) || !reasons.length || !nextSteps.length) return null;
  return {title:trim(v.title,120),summary:trim(v.summary),severity:v.severity,reasons,nextSteps,urgentSigns:strings(v.urgentSigns)};
}
app.get('/api/health',(_req,res)=>res.json({ok:true,llamaConfigured:true,llamaMode:process.env.LLAMA_API_URL?.trim()?'custom':'local-ollama'}));
app.post('/api/analyze',async(req,res)=>{
  const data=req.body||{}, description=trim(data.description,600);
  if(description.length<8) return res.status(400).json({error:'اكتب وصفًا للصوت من 8 أحرف على الأقل.'});
  for(const [key,values] of Object.entries(choices)) if(!values.includes(data[key])) return res.status(400).json({error:'أكمل جميع أسئلة وصف الصوت أولًا.'});
  const LLAMA_API_URL=process.env.LLAMA_API_URL?.trim() || 'http://127.0.0.1:11434/v1/chat/completions';
  const LLAMA_API_KEY=process.env.LLAMA_API_KEY?.trim();
  const LLAMA_MODEL=process.env.LLAMA_MODEL?.trim() || 'llama3.2:3b';
  try {
    const endpoint=new URL(LLAMA_API_URL);
    if(endpoint.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(endpoint.hostname)) return res.status(500).json({error:'رابط مزود Llama غير آمن.'});
    const isLocal=['localhost','127.0.0.1'].includes(endpoint.hostname);
    if(!isLocal && !LLAMA_API_KEY) return res.status(503).json({error:'أضف مفتاح مزود Llama في .env.'});
    const headers={'Content-Type':'application/json'};
    if(LLAMA_API_KEY) headers.Authorization='Bearer '+LLAMA_API_KEY;
    const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({model:LLAMA_MODEL,temperature:0.25,max_tokens:1200,response_format:{type:'json_object'},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify({description,timing:data.timing,sound:data.sound,location:data.location,frequency:data.frequency})}]}),signal:AbortSignal.timeout(isLocal?120000:30000)});
    if(!response.ok){console.error('Llama provider:',response.status);return res.status(502).json({error:isLocal?'تأكد أنك حمّلت نموذج llama3.2:3b باستخدام Ollama.':'خدمة Llama غير متاحة حاليًا، جرّب لاحقًا.'});}
    const json=await response.json();
    let raw=json?.choices?.[0]?.message?.content;
    if(typeof raw!=='string') return res.status(502).json({error:'وصل رد غير مفهوم من Llama.'});
    raw=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    let parsed;try{parsed=JSON.parse(raw)}catch{return res.status(502).json({error:'تعذّر قراءة نتيجة التحليل.'});}
    const result=validateResult(parsed);
    if(!result) return res.status(502).json({error:'نتيجة الذكاء الاصطناعي ناقصة، حاول مرة ثانية.'});
    return res.json({result,poweredBy:'Llama'});
  }catch(error){console.error('Llama request:',error instanceof Error?error.message:'unknown');return res.status(502).json({error:'تعذّر الاتصال بـ Llama. تأكد أن Ollama شغال والنموذج محمّل.'});}
});
app.use('/api',(_req,res)=>res.status(404).json({error:'مسار غير موجود.'}));
app.get('*',(_req,res)=>res.sendFile(path.join(root,'public','index.html')));
app.use((error,_req,res,_next)=>res.status(error?.status||500).json({error:'حدث خطأ غير متوقع.'}));
app.listen(Number(process.env.PORT||3000),()=>console.log('CarNoise AI server running'));
