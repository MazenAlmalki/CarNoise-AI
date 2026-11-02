import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {collectShorts} from './lib/youtubeShorts.js';
const args=process.argv.slice(2);
const value=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
if(args.includes('--help'))console.log('node scripts/collect_youtube_shorts.js --limit 12 --output data/research/youtube_shorts_candidates.json\nCollects metadata candidates only; manual Arabic/English review is still required. Existing files are never overwritten.');
else{
 try{
  const limit=Number(value('--limit')||12);
  const output=path.resolve(value('--output')||'data/research/youtube_shorts_candidates.json');
  const result=await collectShorts({limit});
  if(!result.records.length)throw Error('No verifiable public Shorts candidates were collected; no dataset file was written.');
  await mkdir(path.dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(`Saved ${result.records.length} metadata candidates to ${output}. Video/audio were not reviewed. Bilingual review fields remain empty and runtime use is disabled.`);
 }catch(error){
  console.error(error.code==='EEXIST'?'Output already exists; choose another --output path to preserve your reviews.':error instanceof TypeError?'Cannot reach YouTube. Check authorized network access.':error.message);
  process.exitCode=1;
 }
}
