// Message language takes priority over UI locale; short or mixed messages may
// inherit the user-selected UI language. This is not a language-model call.
export function detectReplyLanguage(message,selected='ar'){
 const text=String(message||'');
 const latin=(text.match(/[A-Za-z]{2,}/g)||[]).length;
 const arabic=(text.match(/[\u0621-\u064A]{2,}/g)||[]).length;
 if(latin>0 && latin>=arabic)return 'en';
 if(arabic>0)return 'ar';
 return selected==='en'?'en':'ar';
}
