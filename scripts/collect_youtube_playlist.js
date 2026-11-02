import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {collectPlaylist} from './lib/youtubePlaylist.js';
const args=process.argv.slice(2),value=name=>{const index=args.indexOf(name);return index<0?null:args[index+1];};
if(args.includes('--help'))console.log('node scripts/collect_youtube_playlist.js --url "https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID" --output data/research/playlist_candidates.json\nInventories the initial public playlist page only. It does not listen to, download, train on, or automatically admit clips. Existing files are never overwritten.');
else{
 try{
  if(!value('--url'))throw Error('Provide --url with the YouTube playlist link.');
  const result=await collectPlaylist(value('--url'));
  const output=path.resolve(value('--output')||'data/research/playlist_candidates.json');
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(`Saved ${result.records.length} playlist metadata candidates to ${output}. Full inventory and audio review are NOT complete. No model was trained.`);
 }catch(error){console.error(error.code==='EEXIST'?'Output exists; choose another --output path to preserve reviews.':error instanceof TypeError?'Cannot reach YouTube; check authorized network access.':error.message);process.exitCode=1;}
}
