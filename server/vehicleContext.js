import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../data/saudi_vehicle_focus_v1.json',import.meta.url),'utf8'));
const normalize=value=>String(value||'').toLowerCase().replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const generic=/^(?:سيارتي|my car|car|سياره)?$/i;
const matches=(text,alias)=>(' '+normalize(text)+' ').includes(' '+normalize(alias)+' ');
export function selectedVehicleContext(vehicle,current='',userStatements=[]){
 const name=typeof vehicle?.name==='string'?vehicle.name.trim().slice(0,120):'';
 const fromName=catalog.vehicles.filter(model=>model.aliases.some(alias=>matches(name,alias)));
 let chosen=fromName.length===1?fromName[0]:null;
 const parseYear=text=>{
  const normalized=String(text||'').replace(/[٠-٩۰-۹]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)>=0?'٠١٢٣٤٥٦٧٨٩'.indexOf(c):'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
  const years=[...normalized.matchAll(/\b((?:19|20)\d{2})\b/g)].filter(match=>!/(?:not|مو|مب|ليس)\s*$/i.test(normalized.slice(0,match.index)));
  const value=years.length?Number(years.at(-1)[1]):null;
  return value&&value>=1980&&value<=new Date().getFullYear()+1?value:null;
 };
 let year=parseYear(String(vehicle?.year||''))||parseYear(name);
 let source=chosen?'selected_vehicle_name':'unrecognized_label';
 const turns=[...(Array.isArray(userStatements)?userStatements:[]).slice(-12),String(current||'').slice(0,700)];
 for(const text of turns){
  const explicit=String(text||'').slice(0,700), normalized=normalize(explicit);
  const found=catalog.vehicles.filter(model=>model.aliases.some(alias=>{
   if(!matches(explicit,alias))return false;
   const tokens=normalized.split(' '),words=normalize(alias).split(' ');
   return tokens.some((_,i)=>tokens.slice(i,i+words.length).join(' ')===words.join(' ')&&!/(?:not(?: a| an| my)?|مو|مب|ليست|ليست سيارتي)$/.test(tokens.slice(Math.max(0,i-3),i).join(' ')));
  }));
  // Questions and nearby vehicle mentions do not change the selected identity.
  const identity=/(?:قصدي|اقصد|سيارتي|موديلها|موديل سيارتي|my car is|i drive|i meant|my model|model year|actually|correction)/i.test(normalized);
  if(identity&&found.length===1){
   const changed=chosen?.id!==found[0].id;
   chosen=found[0];year=parseYear(explicit)??(changed?null:year);source='current_user_description';
  }else if(identity&&found.length===0&&parseYear(explicit)){
   year=parseYear(explicit);source='current_user_description';
  }
 }
 return {name:generic.test(normalize(name))?null:name||null,recognized:Boolean(chosen),
  modelId:chosen?.id||null,make:chosen?.make||null,model:chosen?.model||null,
  year,
  engineVariant:'unknown',source,
  coverage:'shared_guidance_not_model_specific_defect_predictions',
  instruction:'Use the supplied vehicle identity as context only. Do not infer engine, generation-specific failures or recall eligibility. Do not ask for vehicle details again when present, or request missing details unless they change the next useful advice.'};
}
export function vehicleFocusStats(){return {models:catalog.vehicles.length,verifiedSalesRanking:false,modelSpecificVerifiedCases:0};}
