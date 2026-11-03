import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSoundResult,soundResultText} from '../server/soundResult.js';
import {loadAudioReferences,validateReferenceComparison} from '../server/audioReferences.js';
const refs=await loadAudioReferences();
const media=(id='upload1-02',result='clear')=>({type:'audio',audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:true},audioObservation:{provider:'gemini',contentType:'mechanical_sound',hasMechanicalSound:true,hasClearSound:true,description:'A high-pitched squeal',sounds:['squeal'],uncertainty:'Unverified',referenceComparison:validateReferenceComparison({result,referenceIds:['none','unclear'].includes(result)?[]:[id],reason:'Possible resemblance in pitch and rhythm'},refs,true)}});
test('one clear validated reference produces an unverified name and existing source-grounded next steps',async()=>{
 for(const language of ['ar','en']){
  const card=await buildSoundResult({media:media(),language,current:'The brakes squeal when braking'});
  assert.equal(card.status,'possible_match');assert.equal(card.problem,language==='ar'?'القماشات':'Brake pads');assert.equal(card.diagnosisConfirmed,false);
  assert.equal(card.steps.length,2);assert.match(card.sources[0].url,/theaa.com/);assert.equal(card.reference.url,'/api/audio-references/upload1-02');
  assert.match(soundResultText(card,language),language==='ar'?/غير مؤكد/:/tentative/);assert.doesNotMatch(soundResultText(card,language),/\d+%|Gemini|OpenRouter/);
 }
});
test('partial, unknown, ambiguous, mismatched context and failed comparisons never force a name',async()=>{
 const items=[media('upload1-02','partial'),media('upload1-02','none'),media('upload1-03'),{...media(),audioEventAnalysis:{provider:'gemini',attempted:true,succeeded:false}}];
 for(const input of items){const card=await buildSoundResult({media:input,language:'en'});assert.equal(card.status,'no_reliable_match');assert.equal(card.problem,null);assert.equal(card.reference,null);assert.equal(card.steps.length,1);}
 assert.equal((await buildSoundResult({media:media(),language:'en',current:'Not when braking; only at idle'})).problem,null);
 assert.equal((await buildSoundResult({media:media(),language:'en',conflicts:[{status:'possible_conflict'}]})).problem,null);
 assert.equal((await buildSoundResult({media:media(),language:'en',current:'My sound is different from the example.'})).problem,null);
 const spoof=media();spoof.audioObservation.referenceComparison.matches[0].label_en='Confirmed engine failure';assert.equal((await buildSoundResult({media:spoof,language:'en'})).problem,'Brake pads');
 spoof.audioObservation.referenceComparison.matches[0].id='unknown';assert.equal((await buildSoundResult({media:spoof,language:'en'})).problem,null);
});
test('speech, music, silence, other and uncertain clips never produce a possible fault',async()=>{
 for(const type of ['speech','mixed','music','silence','other','uncertain']){
  const input=media();Object.assign(input.audioObservation,{contentType:type,hasMechanicalSound:false});
  const card=await buildSoundResult({media:input,language:'en'});assert.equal(card.status,'no_reliable_match');assert.equal(card.problem,null);
 }
});
test('the reuploaded videos reuse exact PCM and retain reference-only source groups and unverified labels',()=>{
 const report=JSON.parse(readFileSync(new URL('../data/car-audio/source-review.json',import.meta.url)));
 assert.equal(report.sources.length,2);assert.equal(report.independent_evaluation_recordings,0);assert.equal(report.recognition_accuracy,null);
 for(const source of report.sources){assert.equal(source.matches_existing_source_hash,true);for(const record of source.reference_records){assert.equal(record.source_window_pcm_equals_existing_reference,true);assert.equal(record.reference_sha256_matches,true);}}
 for(const ref of refs){assert.equal(ref.fault_verified,false);assert.equal(ref.split,'reference_only');assert.equal(ref.source_group_sha256,ref.source_sha256);assert.equal(ref.label_alignment_review.acoustic_review_status,'not_listened_to_in_this_environment');}
});

test('history remains unverified context and a source video does not establish vehicle-specific faults',async()=>{
 const card=await buildSoundResult({media:media(),language:'en',vehicle:{modelId:'toyota-camry',year:2018},history:[{description:'Not when braking'}],current:'The same sound again'});
 assert.equal(card.status,'no_reliable_match');
 const named=await buildSoundResult({media:media(),language:'en',vehicle:{modelId:'toyota-camry',year:2018},safety:'Stop safely if braking is impaired.'});
 assert.equal(named.safety,'Stop safely if braking is impaired.');assert.match(named.labelNote,/not establish a model-specific fault/);
});

test('unvalidated percentages, repair directives and provider debug do not enter the resemblance sentence',async()=>{
 for(const reason of ['Gemini API confidence 95%','التطابق بنسبة ٧٠٪','Replace the brake pads; confirmed fault']){
  const input=media();input.audioObservation.referenceComparison.reason=reason;
  const card=await buildSoundResult({media:input,language:reason.startsWith('التطابق')?'ar':'en'});
  assert.doesNotMatch(card.why,/Gemini|API|95|٧٠|%|٪|Replace|confirmed fault/);
 }
});

test('saved known-result narration omits old implementation fields and retains tentative wording',async()=>{
 const {soundResultNarration}=await import('../public/sound-result.js');
 const result=soundResultNarration({status:'known_recording',title:'Known reference recording',problem:'القماشات',why:'مطابق بالبايت SHA256',labelNote:'نفس الملف المرجعي',steps:['اطلب فحص الفرامل'],diagnosisConfirmed:false},'ar');
 assert.match(result,/المشكلة المحتملة/);assert.match(result,/القماشات/);assert.match(result,/فحص الفرامل/);assert.doesNotMatch(result,/مطابق بالبايت|SHA256|نفس الملف|Known reference/);
});
