// Public-page metadata discovery only. Never asserts that audio/video was reviewed.
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(id);
export function assignedYouTubeJSON(html,name){
 for(const pattern of [new RegExp('(?:var\\s+)?'+name+'\\s*=\\s*'),new RegExp('window\\["'+name+'"\\]\\s*=\\s*')]){
  const found=pattern.exec(html);if(!found)continue;
  let start=found.index+found[0].length;while(/\s/.test(html[start]||''))start++;
  if(html[start]!=='{')continue;
  let depth=0,quoted=false,escape=false;
  for(let i=start;i<html.length;i++){
   const char=html[i];
   if(quoted){if(escape)escape=false;else if(char==='\\')escape=true;else if(char==='"')quoted=false;continue;}
   if(char==='"'){quoted=true;continue;}
   if(char==='{')depth++;else if(char==='}'&&--depth===0){try{return JSON.parse(html.slice(start,i+1));}catch{break;}}
  }
 }
 throw Error('YouTube page metadata was unavailable. Sign-in/consent or a page-format change may prevent discovery.');
}
export function discoverShortIds(data){
 const found=new Set(),stack=[data];let visited=0;
 while(stack.length){
  const node=stack.pop();if(!node||typeof node!=='object')continue;
  if(++visited>250000)throw Error('YouTube search metadata exceeded the inspection limit.');
  if(validId(node.reelWatchEndpoint?.videoId))found.add(node.reelWatchEndpoint.videoId);
  for(const value of Object.values(node)){
   if(typeof value==='string'){
    const match=value.match(/^\/(?:shorts)\/([a-zA-Z0-9_-]{11})(?:[/?#]|$)/);if(match)found.add(match[1]);
   }else if(value&&typeof value==='object')stack.push(value);
  }
 }
 return [...found];
}
export function shortCandidate(player,id,{queries=[],checkedAt=new Date().toISOString()}={}){
 if(!validId(id))throw Error('Invalid YouTube video ID.');
 const details=player?.videoDetails;
 if(player?.playabilityStatus?.status!=='OK'||details?.videoId!==id||typeof details.title!=='string'||!details.title.trim()||typeof details.author!=='string')throw Error('Short metadata could not be verified as a publicly playable video.');
 const seconds=Number(details.lengthSeconds);
 if(!Number.isFinite(seconds)||seconds<=0||seconds>180||details.isLiveContent===true)throw Error('Result is outside this collector’s Shorts duration scope (up to 180 seconds).');
 return {id:'ytshort-'+id,video_id:id,url:'https://www.youtube.com/shorts/'+id,original_title:details.title.trim().slice(0,250),channel:details.author.trim().slice(0,160),duration_seconds:seconds,
  discovered_by_queries:queries,metadata_checked_at:checkedAt,
  evidence:{shorts_search_result:true,metadata_checked:true,video_reviewed:false,audio_reviewed:false,transcript_reviewed:false,mechanical_fault_confirmed:false},
  bilingual_summary:{ar:null,en:null},sound_topics:[],observed_conditions:{ar:null,en:null},
  license:'not_verified',usage:'discovery_candidate_not_training_audio',eligible_for_runtime:false};
}
export async function youtubePage(url,{fetchImpl=fetch}={}){
 const parsed=new URL(url);
 const allowedPath=parsed.pathname==='/results'||/^\/shorts\/[a-zA-Z0-9_-]{11}$/.test(parsed.pathname)||(parsed.pathname==='/playlist'&&/^[a-zA-Z0-9_-]{10,100}$/.test(parsed.searchParams.get('list')||''));
 if(parsed.origin!=='https://www.youtube.com'||!allowedPath)throw Error('Only public YouTube search, Shorts and playlist pages are supported.');
 const response=await fetchImpl(url,{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'en,ar;q=0.9'},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error(`YouTube HTTP ${response.status}. Check authorized network access; this collector does not bypass blocks.`);
 const reader=response.body.getReader();let total=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>10*1024*1024)throw Error('YouTube page exceeded 10 MB.');chunks.push(value);}}
 finally{await reader.cancel().catch(()=>{});}
 return Buffer.concat(chunks).toString('utf8');
}
export async function collectShorts({limit=12,queries=['اصوات مشاكل سيارات','car problem sounds'],fetchPage=youtubePage,checkedAt=new Date().toISOString()}={}){
 if(!Number.isInteger(limit)||limit<1||limit>50)throw Error('Limit must be between 1 and 50.');
 const candidates=new Map(),failures=[];
 for(const query of queries){
  const url=new URL('https://www.youtube.com/results');url.searchParams.set('search_query',query+' shorts');
  const ids=discoverShortIds(assignedYouTubeJSON(await fetchPage(url.href),'ytInitialData'));
  for(const id of ids){if(candidates.size>=limit&&!candidates.has(id))break;const entry=candidates.get(id)||[];if(!entry.includes(query))entry.push(query);candidates.set(id,entry);}
 }
 const records=[];
 for(const [id,sourceQueries] of candidates){
  try{records.push(shortCandidate(assignedYouTubeJSON(await fetchPage('https://www.youtube.com/shorts/'+id),'ytInitialPlayerResponse'),id,{queries:sourceQueries,checkedAt}));}
  catch{failures.push({video_id:id,reason:'Public playable Shorts metadata could not be verified; not admitted.'});}
 }
 return {schema_version:1,checked_at:checkedAt,queries,review_status:'metadata_discovery_only_no_audio_or_video_review',records,failures};
}
