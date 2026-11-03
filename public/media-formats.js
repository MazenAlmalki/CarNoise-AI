// Shared browser/server allowlist. MIME describes the container, not verified bytes.
export const MAX_MEDIA_BYTES=25*1024*1024;
export const MEDIA_FORMATS=Object.freeze({
 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp',
 'audio/wav':'.wav','audio/x-wav':'.wav','audio/mpeg':'.mp3','audio/mp4':'.m4a','audio/x-m4a':'.m4a','audio/aac':'.aac','audio/ogg':'.ogg','audio/webm':'.webm',
 'video/mp4':'.mp4','video/webm':'.webm','video/quicktime':'.mov'
});
export const MEDIA_ACCEPT=Object.keys(MEDIA_FORMATS).join(',');
export function mediaMime(type){return typeof type==='string'?type.split(';')[0].trim().toLowerCase():'';}
export function validateMedia({type,mimetype,size}={}){
 const mime=mediaMime(type||mimetype);
 if(!Object.hasOwn(MEDIA_FORMATS,mime))return {ok:false,error:'unsupported-type'};
 if(!Number.isFinite(size)||size<=0)return {ok:false,error:'empty-file'};
 if(size>MAX_MEDIA_BYTES)return {ok:false,error:'too-large'};
 return {ok:true,mime,extension:MEDIA_FORMATS[mime]};
}
