import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory=new URL('../data/uploaded_audio_references/',import.meta.url);
let cached=null;
// Raw audio is used for in-context comparison; this is not model fine-tuning.
export async function loadAudioReferences(env=process.env){
 if(env.GEMINI_REFERENCE_AUDIO==='0')return [];
 const manifest=JSON.parse(await readFile(new URL('manifest.json',directory),'utf8'));
 if(!Array.isArray(manifest.records)||manifest.records.length>20)throw Error('Invalid audio reference manifest.');
 for(const record of manifest.records){
  if(!/^[a-z0-9-]+$/.test(record.id)||record.file!==record.id+'.wav'||record.fault_verified!==false)throw Error('Invalid or verified-fault audio reference manifest.');
 }
 // Reuse hash-checked bytes while the manifest and file metadata are unchanged.
 // Never use source titles as acoustic labels or as confirmed repair evidence.
 const stats=await Promise.all(manifest.records.map(record=>stat(new URL(record.file,directory))));
 const signature=JSON.stringify([manifest,stats.map(s=>[s.size,s.mtimeMs,s.ctimeMs])]);
 if(cached?.signature===signature)return cached.records.map(r=>({...r}));
 let total=0;
 const records=await Promise.all(manifest.records.map(async record=>{
  if(!/^[a-z0-9-]+$/.test(record.id)||record.file!==record.id+'.wav')throw Error('Invalid reference filename.');
  const wav=await readFile(new URL(record.file,directory));
  total+=wav.length;
  if(total>1500000||wav.length<44||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE'||createHash('sha256').update(wav).digest('hex')!==record.sha256)throw Error('Audio reference integrity check failed.');
  return {...record,wav,base64:wav.toString('base64')};
 }));
 cached={signature,records};
 return records.map(r=>({...r}));
}
export function validateReferenceComparison(value,references,hasClearSound){
 if(!value||!['clear','partial','none','unclear'].includes(value.result)||typeof value.reason!=='string'||!value.reason.trim()||!Array.isArray(value.referenceIds)||value.referenceIds.length>3)throw Error('Invalid reference comparison.');
 const byId=new Map(references.map(x=>[x.id,x]));
 if(new Set(value.referenceIds).size!==value.referenceIds.length||value.referenceIds.some(id=>!byId.has(id)))throw Error('Unknown audio reference.');
 if((value.result==='clear'||value.result==='partial')&&!value.referenceIds.length||['none','unclear'].includes(value.result)&&value.referenceIds.length)throw Error('Inconsistent audio comparison.');
 const clear=hasClearSound&&value.result==='clear'&&value.referenceIds.length===1;
 return {source:'gemini_direct_audio_reference_comparison',result:hasClearSound?value.result:'unclear',
  reason:value.reason.trim().slice(0,500),needsClarification:!clear,diagnosisConfirmed:false,
  matches:hasClearSound?value.referenceIds.map(id=>{const r=byId.get(id);return {id,label_ar:r.label_ar,label_en:r.label_en,labelProvenance:r.label_provenance,faultVerified:false,labelVerification:'unverified_uploader_hypothesis',acousticCategory:r.acoustics?.reviewed_category||null};}):[]};
}
