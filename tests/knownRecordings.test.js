import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createKnownRecordingMatcher,identifyKnownRecording,verifiedKnownRecording} from '../server/knownRecordings.js';
import {buildSoundResult} from '../server/soundResult.js';
function wav(){
 const data=Buffer.alloc(32000),header=Buffer.alloc(44);
 for(let i=0;i<16000;i++)data.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/16000)*4000),i*2);
 header.write('RIFF');header.writeUInt32LE(data.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(16000,24);header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
 return Buffer.concat([header,data]);
}
const bytes=wav();
const record={id:'four-test',reference_id:'upload1-02',pcm_sha256:createHash('sha256').update(bytes.subarray(44)).digest('hex'),sample_count:16000,fault_verified:false};
test('identity requires exact decoded PCM, independent of a WAV container header or supplied filename',()=>{
 const matcher=createKnownRecordingMatcher([record]);const proof=matcher.identifyKnownRecording(bytes);assert.equal(matcher.verifiedKnownRecording(proof).id,'four-test');
 const altered=Buffer.from(bytes);altered[100]^=1;assert.equal(matcher.identifyKnownRecording(altered),null);
 assert.equal(identifyKnownRecording(bytes),null,'unregistered tone must not match a real user clip');
 assert.equal(matcher.identifyKnownRecording(Buffer.from('القماشات.mp4')),null);
 assert.equal(matcher.identifyKnownRecording(Buffer.alloc(bytes.length)),null);
 const wrongRate=Buffer.from(bytes);wrongRate.writeUInt32LE(8000,24);assert.equal(matcher.identifyKnownRecording(wrongRate),null);
});
test('client labels and invented identity proofs do not become a named fault',async()=>{
 const matcher=createKnownRecordingMatcher([record]),proof=matcher.identifyKnownRecording(bytes);
 assert.equal(matcher.verifiedKnownRecording({...proof,referenceId:'upload1-08'}),null);
 assert.equal(matcher.verifiedKnownRecording({...proof,proof:'0'.repeat(64)}),null);
 assert.equal(verifiedKnownRecording(proof),null,'a proof from another matcher/process is not accepted');
 const card=await buildSoundResult({media:{type:'video',localReferenceIdentity:{...proof,label_ar:'Confirmed engine failure'}},language:'en'});
 assert.equal(card.problem,null);assert.equal(card.status,'no_reliable_match');
});
test('ambiguous PCM identity in a registry cannot be forced to one label',()=>{
 const matcher=createKnownRecordingMatcher([record,{...record,id:'four-other',reference_id:'upload1-08'}]);assert.equal(matcher.identifyKnownRecording(bytes),null);
});

test('exact registered source bytes are identified without decoding and cannot be confused with PCM proof',()=>{
 const source=Buffer.from('registered original file bytes');
 const matcher=createKnownRecordingMatcher([{...record,source_file_sha256:createHash('sha256').update(source).digest('hex')}]);
 const identity=matcher.identifyKnownSourceFile(source);assert.equal(identity.source,'local_exact_file_identity');assert.equal(matcher.verifiedKnownRecording(identity).identityMethod,'local_exact_file_identity');
 const changed=Buffer.from(source);changed[0]^=1;assert.equal(matcher.identifyKnownSourceFile(changed),null);
 assert.equal(matcher.identifyKnownSourceFile(Buffer.from('بطة السير.mp4')),null);
 assert.equal(matcher.verifiedKnownRecording({...identity,source:'local_exact_pcm_identity',pcmSha256:record.pcm_sha256}),null);
 const pcmProof=matcher.identifyKnownRecording(bytes);assert.equal(matcher.verifiedKnownRecording({...pcmProof,source:'local_exact_file_identity',fileSha256:createHash('sha256').update(source).digest('hex')}),null);
});
