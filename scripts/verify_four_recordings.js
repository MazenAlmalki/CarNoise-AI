// Real supplied files + exact local identity + result builder. External inference is forbidden.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {analyzeUploadedMedia} from '../server/multimodal.js';
import {buildSoundResult} from '../server/soundResult.js';
const index=JSON.parse(await readFile(new URL('../data/car-audio/known-recordings.json',import.meta.url),'utf8'));
const paths=process.argv.slice(2);if(paths.length!==4)throw Error('Supply the four original MP4 paths, in any order.');
let calls=0;const seen=new Set();
for(const file of paths){
 const buffer=await readFile(file),sha=createHash('sha256').update(buffer).digest('hex');
 const expected=index.records.find(r=>r.source_file_sha256===sha);assert.ok(expected,'Unregistered original file');assert.ok(!seen.has(expected.id),'Repeated file');seen.add(expected.id);
 const media=await analyzeUploadedMedia({buffer,size:buffer.length,mimetype:'video/mp4',originalname:'unrelated-name.mp4'},'ar',{env:{...process.env,AUDIO_PROVIDER:'gemini',GEMINI_API_KEY:'unused-fixture',GEMINI_AUDIO_MODEL:'fixture',LOCAL_REFERENCE_IDENTITY:'1'},fetchImpl:async()=>{calls++;throw Error('External inference is forbidden in this test');}});
 const card=await buildSoundResult({media,language:'ar'});assert.equal(media.localReferenceIdentity?.recordId,expected.id);assert.equal(card.status,'known_recording');assert.equal(card.problem,expected.label_ar);assert.equal(card.diagnosisConfirmed,false);assert.ok(card.steps.length>=2);assert.equal(calls,0);
 console.log(JSON.stringify({recordId:expected.id,label:card.problem,result:card.status,method:media.localReferenceIdentity.source,externalCalls:calls,classificationAccuracy:null}));
}
assert.equal(seen.size,4);console.log('PASS: four registered recordings identified by exact file/audio identity; no external inference or training. This does not measure fault recognition.');
