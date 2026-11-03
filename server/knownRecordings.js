// Exact registered-file or decoded-audio identity, not acoustic classification or fault inference.
import {readFileSync} from 'node:fs';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const index=JSON.parse(readFileSync(new URL('../data/car-audio/known-recordings.json',import.meta.url),'utf8'));
function pcm(wav){
 if(!Buffer.isBuffer(wav)||wav.length<44||wav.length>220000||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE')return null;
 let format=null,data=null;
 for(let offset=12;offset+8<=wav.length;){
  const id=wav.toString('ascii',offset,offset+4),size=wav.readUInt32LE(offset+4),start=offset+8;
  if(size>wav.length-start)return null;
  if(id==='fmt '&&size>=16)format={encoding:wav.readUInt16LE(start),channels:wav.readUInt16LE(start+2),rate:wav.readUInt32LE(start+4),bits:wav.readUInt16LE(start+14)};
  if(id==='data'){if(data)return null;data=wav.subarray(start,start+size);}
  offset=start+size+(size%2);
 }
 if(format?.encoding!==1||format.channels!==1||format.rate!==16000||format.bits!==16||!data?.length||data.length%2)return null;
 return data;
}
export function createKnownRecordingMatcher(records){
 const signingKey=randomBytes(32);
 if(!Array.isArray(records)||records.length>20||records.some(r=>!/^four-[a-z-]+$/.test(r.id)||!/^upload[12]-\d{2}$/.test(r.reference_id)||!/^[a-f0-9]{64}$/.test(r.pcm_sha256)||!Number.isInteger(r.sample_count)||r.sample_count<1600||r.sample_count>96000||r.fault_verified!==false||(r.source_file_sha256!==undefined&&!/^[a-f0-9]{64}$/.test(r.source_file_sha256))))throw Error('Invalid known recording index');
const signature=(r,source='local_exact_pcm_identity')=>createHmac('sha256',signingKey).update([source,r.id,r.reference_id,source==='local_exact_file_identity'?r.source_file_sha256:r.pcm_sha256,r.sample_count].join('|')).digest('hex');
function identifyKnownRecording(wav){
 const samples=pcm(wav);if(!samples)return null;
 const digest=createHash('sha256').update(samples).digest('hex');
 const matches=records.filter(r=>r.pcm_sha256===digest&&r.sample_count===samples.length/2);
 if(matches.length!==1)return null;
 const record=matches[0];
 return {version:1,source:'local_exact_pcm_identity',recordId:record.id,referenceId:record.reference_id,pcmSha256:digest,sampleCount:record.sample_count,proof:signature(record)};
}
function identifyKnownSourceFile(buffer){
 if(!Buffer.isBuffer(buffer)||!buffer.length||buffer.length>25*1024*1024)return null;
 const digest=createHash('sha256').update(buffer).digest('hex');
 const matches=records.filter(r=>r.source_file_sha256===digest);if(matches.length!==1)return null;
 const record=matches[0];
 return {version:1,source:'local_exact_file_identity',recordId:record.id,referenceId:record.reference_id,fileSha256:digest,sampleCount:record.sample_count,proof:signature(record,'local_exact_file_identity')};
}
function verifiedKnownRecording(value){
 if(value?.version!==1||!['local_exact_pcm_identity','local_exact_file_identity'].includes(value.source)||!/^[a-f0-9]{64}$/.test(value.proof||''))return null;
 const record=records.find(r=>r.id===value.recordId&&r.reference_id===value.referenceId&&r.sample_count===value.sampleCount&&
  (value.source==='local_exact_file_identity'?r.source_file_sha256===value.fileSha256&&/^[a-f0-9]{64}$/.test(value.fileSha256||''):r.pcm_sha256===value.pcmSha256));
 if(!record||!timingSafeEqual(Buffer.from(value.proof,'hex'),Buffer.from(signature(record,value.source),'hex')))return null;
 return {...record,identityMethod:value.source};
}

 return {identifyKnownRecording,identifyKnownSourceFile,verifiedKnownRecording};
}
if(index.version!==1)throw Error('Invalid known recording version');
export const {identifyKnownRecording,identifyKnownSourceFile,verifiedKnownRecording}=createKnownRecordingMatcher(index.records);

export function knownRecordingStatus(env=process.env){return {enabled:env.LOCAL_REFERENCE_IDENTITY!=='0',registeredFiles:index.records.filter(r=>r.source_file_sha256).length,exactFileMatchNeedsDecoder:false,scope:'registered_recording_identity_only'};}
