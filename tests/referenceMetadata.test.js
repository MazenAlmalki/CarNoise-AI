import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveSoundReading} from '../server/soundReferences.js';
import {readFileSync} from 'node:fs';

test('existing references are bilingual without promoting unreviewed metadata to verified audio',()=>{
 const records=JSON.parse(readFileSync(new URL('../data/youtube_car_sound_references_v1.json',import.meta.url),'utf8'));
 assert.equal(records.length,28);assert.ok(records.every(x=>x.summary_ar&&x.summary_en&&x.actual_audio_verified===false&&x.metadata_rechecked_this_task===false));
 for(const [query,language] of [['الفرامل تصفر','ar'],['my brakes squeal','en']]){
  const matches=retrieveSoundReading(query,{language});assert.ok(matches.some(x=>x.subject==='brake_squeal'));assert.ok(matches.every(x=>x.summary_ar&&x.summary_en&&x.audio_verified===false));
  assert.match(matches[0].title,language==='ar'?/[\u0600-\u06ff]/:/[a-z]/i);
 }
});
