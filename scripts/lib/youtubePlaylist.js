import {assignedYouTubeJSON,youtubePage} from './youtubeShorts.js';
const validVideo=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(id);
const text=value=>typeof value?.simpleText==='string'?value.simpleText:Array.isArray(value?.runs)?value.runs.map(x=>typeof x.text==='string'?x.text:'').join(''):null;
export function playlistSource(value){
 let url;try{url=new URL(String(value).replace(/&amp;/g,'&'));}catch{throw Error('Provide a YouTube URL containing a playlist list= parameter.');}
 if(url.protocol!=='https:'||!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(url.hostname))throw Error('Only HTTPS YouTube playlist links are supported.');
 const playlist=url.searchParams.get('list');
 if(!/^[a-zA-Z0-9_-]{10,100}$/.test(playlist||''))throw Error('The URL needs a valid playlist list= parameter.');
 return {playlist_id:playlist,url:'https://www.youtube.com/playlist?list='+encodeURIComponent(playlist),
  seed_video_id:validVideo(url.searchParams.get('v'))?url.searchParams.get('v'):null};
}
export function playlistCandidates(data,source,{checkedAt=new Date().toISOString()}={}){
 const stack=[data],records=new Map();let visited=0,continuation=false;
 while(stack.length){
  const node=stack.pop();if(!node||typeof node!=='object')continue;
  if(++visited>250000)throw Error('Playlist metadata exceeded the inspection limit.');
  if(node.continuationItemRenderer)continuation=true;
  const item=node.playlistVideoRenderer||node.playlistPanelVideoRenderer;
  if(item&&validVideo(item.videoId)&&!records.has(item.videoId)){
   records.set(item.videoId,{id:'ytplaylist-'+item.videoId,video_id:item.videoId,url:'https://www.youtube.com/watch?v='+item.videoId,
    playlist_id:source.playlist_id,original_title:text(item.title)?.slice(0,250)||null,channel:text(item.shortBylineText)?.slice(0,160)||null,
    inventory_provenance:'public_playlist_initial_page_metadata',
    evidence:{playlist_metadata_seen:true,video_opened:false,video_reviewed:false,audio_reviewed:false,mechanical_fault_confirmed:false},
    bilingual_summary:{ar:null,en:null},sound_observations:{ar:null,en:null},license:'not_verified',eligible_for_runtime:false});
  }
  // Preserve source order while traversing nested arrays/objects.
  const values=Object.values(node);for(let i=values.length-1;i>=0;i--)if(values[i]&&typeof values[i]==='object')stack.push(values[i]);
 }
 return {schema_version:1,checked_at:checkedAt,source,collection_scope:'initial_public_playlist_page_only',has_continuation:continuation,
  inventory_complete:false,review_status:'metadata_candidates_only_no_audio_review',records:[...records.values()]};
}
export async function collectPlaylist(value,{fetchPage=youtubePage,checkedAt}={}){
 const source=playlistSource(value);
 const data=assignedYouTubeJSON(await fetchPage(source.url),'ytInitialData');
 const result=playlistCandidates(data,source,{checkedAt});
 if(!result.records.length)throw Error('No playlist entries were accessible. No recording data has been collected.');
 return result;
}
