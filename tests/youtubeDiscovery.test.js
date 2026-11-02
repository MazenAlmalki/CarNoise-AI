import test from 'node:test';
import assert from 'node:assert/strict';
import {assignedYouTubeJSON,discoverShortIds,shortCandidate,collectShorts,youtubePage} from '../scripts/lib/youtubeShorts.js';
import {retrieveSoundReading} from '../server/soundReferences.js';
import {readFileSync} from 'node:fs';
const id='fixture0001';
const player={playabilityStatus:{status:'OK'},videoDetails:{videoId:id,title:'Fixture only, not a real video',author:'Test fixture',lengthSeconds:'30'}};

test('extracts JSON without executing page scripts and handles braces/escaped quotes',()=>{
 const object={name:'a } brace and " quote',reelWatchEndpoint:{videoId:id}};
 assert.deepEqual(assignedYouTubeJSON('var ytInitialData = '+JSON.stringify(object)+'; ignored();','ytInitialData'),object);
 assert.deepEqual(discoverShortIds(object),[id]);
 assert.deepEqual(discoverShortIds({videoRenderer:{videoId:id}}),[],'ordinary videos are not treated as Shorts');
 assert.throws(()=>assignedYouTubeJSON('no metadata','ytInitialData'),/unavailable/);
});

test('candidates retain provenance and cannot claim viewing/listening or completed bilingual review',()=>{
 const item=shortCandidate(player,id,{queries:['اصوات مشاكل سيارات'],checkedAt:'2026-11-02T00:00:00Z'});
 assert.equal(item.evidence.audio_reviewed,false);assert.equal(item.evidence.video_reviewed,false);assert.equal(item.evidence.mechanical_fault_confirmed,false);
 assert.equal(item.eligible_for_runtime,false);assert.deepEqual(item.bilingual_summary,{ar:null,en:null});
 assert.throws(()=>shortCandidate({...player,playabilityStatus:{status:'LOGIN_REQUIRED'}},id),/playable/);
 assert.throws(()=>shortCandidate({...player,videoDetails:{...player.videoDetails,lengthSeconds:'400'}},id),/duration/);
});

test('collects both-language queries, deduplicates only verified Shorts metadata, and propagates policy blocks',async()=>{
 const queries=[];const result=await collectShorts({fetchPage:async url=>{
  if(url.includes('/results')){queries.push(new URL(url).searchParams.get('search_query'));return 'var ytInitialData = '+JSON.stringify({reelWatchEndpoint:{videoId:id}})+';';}
  return 'var ytInitialPlayerResponse = '+JSON.stringify(player)+';';
 }});
 assert.deepEqual(queries,['اصوات مشاكل سيارات shorts','car problem sounds shorts']);assert.equal(result.records.length,1);assert.equal(result.records[0].discovered_by_queries.length,2);
 await assert.rejects(()=>collectShorts({fetchPage:async()=>{throw Error('YouTube HTTP 403');}}),/403/);
 await assert.rejects(()=>youtubePage('https://other.invalid/results'),/Only public YouTube/);
});

test('existing references are bilingual without promoting unreviewed metadata to verified audio',()=>{
 const records=JSON.parse(readFileSync(new URL('../data/youtube_car_sound_references_v1.json',import.meta.url),'utf8'));
 assert.equal(records.length,28);assert.ok(records.every(x=>x.summary_ar&&x.summary_en&&x.actual_audio_verified===false&&x.metadata_rechecked_this_task===false));
 for(const [query,language] of [['الفرامل تصفر','ar'],['my brakes squeal','en']]){
  const matches=retrieveSoundReading(query,{language});assert.ok(matches.some(x=>x.subject==='brake_squeal'));assert.ok(matches.every(x=>x.summary_ar&&x.summary_en&&x.audio_verified===false));
  assert.match(matches[0].title,language==='ar'?/[\u0600-\u06ff]/:/[a-z]/i);
 }
});
