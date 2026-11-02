// Hosted Meta Llama via OpenRouter. Chat no longer defaults to Ollama/Qwen.
// Legacy LLAMA_API_KEY is accepted only as a key for the configured endpoint.
export const DEFAULT_CHAT_API_URL='https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_CHAT_MODEL='meta-llama/llama-3.3-70b-instruct';
export function chatProvider(env=process.env){
 const endpoint=(env.CHAT_API_URL||DEFAULT_CHAT_API_URL).trim();
 const requested=(env.CHAT_MODEL||DEFAULT_CHAT_MODEL).trim();
 // Ignore stale local model names from old .env files when using OpenRouter.
 const model=(env.CHAT_API_URL||DEFAULT_CHAT_API_URL).includes('openrouter.ai')
  ? requested.startsWith('meta-llama/')?requested:DEFAULT_CHAT_MODEL : requested;
 const key=(env.CHAT_API_KEY||env.OPENROUTER_API_KEY||env.LLAMA_API_KEY||'').trim();
 // Require the key before attempting a remote API request.
 const endpointIsLocal=/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\//i.test(endpoint);
 if(!endpointIsLocal&&!key)throw Error('CHAT_API_KEY_MISSING');
 const parsed=new URL(endpoint);
 const local=['localhost','127.0.0.1'].includes(parsed.hostname);
 if(parsed.protocol!=='https:'&&!local)throw Error('Remote chat API must use HTTPS');
 return {endpoint,model,key,local};
}
export function publicChatConfiguration(env=process.env){
 try{
  const info=chatProvider(env);
  return {provider:new URL(info.endpoint).hostname,model:info.model,configured:true,local:info.local};
 }catch(error){
  return {provider:'OpenRouter API',model:(env.CHAT_MODEL?.startsWith('meta-llama/')?env.CHAT_MODEL:DEFAULT_CHAT_MODEL),configured:false,reason:error.message==='CHAT_API_KEY_MISSING'?'API key missing':'Invalid chat provider configuration'};
 }
}
