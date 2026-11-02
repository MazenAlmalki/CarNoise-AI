import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../data/saudi_vehicle_focus_v1.json',import.meta.url),'utf8'));
const normalize=value=>String(value||'').toLowerCase().replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const generic=/^(?:سيارتي|my car|car|سياره)?$/i;
const matches=(text,alias)=>(' '+normalize(text)+' ').includes(' '+normalize(alias)+' ');
export function selectedVehicleContext(vehicle,current=''){
 const name=typeof vehicle?.name==='string'?vehicle.name.trim().slice(0,120):'';
 const explicit=String(current||'').slice(0,700);
 // Current explicit model corrections take priority over an old vehicle label.
 const fromCurrent=catalog.vehicles.filter(model=>model.aliases.some(alias=>matches(explicit,alias)));
 const fromName=catalog.vehicles.filter(model=>model.aliases.some(alias=>matches(name,alias)));
 const correction=/(?:قصدي|اقصد|سيارتي|my car is|i drive|i meant)/i.test(normalize(explicit));
 const currentChosen=fromCurrent.length===1&&(fromName.length!==1||correction);
 const candidates=currentChosen?fromCurrent:fromName;
 const chosen=candidates.length===1?candidates[0]:null;
 const relevant=currentChosen?explicit:name;
 const yearText=relevant+(chosen&&fromName.length===1&&chosen.id===fromName[0].id?' '+name:'');
 const yearMatch=yearText.replace(/[٠-٩]/g,char=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(char))).match(/\b((?:19|20)\d{2})\b/);
 const year=yearMatch?Number(yearMatch[1]):null;
 return {name:generic.test(normalize(name))?null:name||null,recognized:Boolean(chosen),
  modelId:chosen?.id||null,make:chosen?.make||null,model:chosen?.model||null,
  year:year&&year>=1980&&year<=new Date().getFullYear()+1?year:null,
  engineVariant:'unknown',source:currentChosen?'current_user_description':chosen?'selected_vehicle_name':'unrecognized_label',
  coverage:'shared_guidance_not_model_specific_defect_predictions',
  instruction:'Use the supplied vehicle identity as context only. Do not infer engine, generation-specific failures or recall eligibility. Do not ask for vehicle details again when present, or request missing details unless they change the next useful advice.'};
}
export function vehicleFocusStats(){return {models:catalog.vehicles.length,verifiedSalesRanking:false,modelSpecificVerifiedCases:0};}
