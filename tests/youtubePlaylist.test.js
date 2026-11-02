import test from 'node:test';
import assert from 'node:assert/strict';
import {playlistSource,playlistCandidates,collectPlaylist} from '../scripts/lib/youtubePlaylist.js';
const link='https://www.youtube.com/watch?v=ciVOqe7ji2Q&list=PLAfTiqc9y29huuPbBepZyvRS4OPpzkSLw';

test('preserves the user-supplied source without asserting seed-video membership or audio review',()=>{
 const source=playlistSource(link);assert.equal(source.seed_video_id,'ciVOqe7ji2Q');assert.equal(source.playlist_id,'PLAfTiqc9y29huuPbBepZyvRS4OPpzkSLw');
 assert.match(source.url,/\/playlist\?list=/);assert.throws(()=>playlistSource('https://other.invalid/?list=PLAfTiqc9y29huuPbBepZyvRS4OPpzkSLw'),/YouTube/);
});

test('keeps per-clip metadata order and leaves bilingual/audio-review fields pending',()=>{
 const source=playlistSource(link);
 const result=playlistCandidates({contents:[{playlistVideoRenderer:{videoId:'fixture0001',title:{runs:[{text:'Fixture one'}]}}},{playlistVideoRenderer:{videoId:'fixture0002',title:{simpleText:'Fixture two'}}},{playlistVideoRenderer:{videoId:'fixture0001'}},{continuationItemRenderer:{}}]},source);
 assert.deepEqual(result.records.map(x=>x.video_id),['fixture0001','fixture0002']);assert.equal(result.has_continuation,true);assert.equal(result.inventory_complete,false);
 assert.ok(result.records.every(x=>!x.evidence.audio_reviewed&&!x.evidence.video_opened&&!x.eligible_for_runtime));assert.deepEqual(result.records[0].bilingual_summary,{ar:null,en:null});
 assert.ok(!result.records.some(x=>x.video_id===source.seed_video_id),'a source URL alone is not verified membership');
});

test('blocked or empty playlist pages cannot create fictional recordings',async()=>{
 await assert.rejects(()=>collectPlaylist(link,{fetchPage:async()=>{throw Error('YouTube HTTP 403');}}),/403/);
 await assert.rejects(()=>collectPlaylist(link,{fetchPage:async()=> 'var ytInitialData = {"contents": []};'}),/No playlist entries/);
});
