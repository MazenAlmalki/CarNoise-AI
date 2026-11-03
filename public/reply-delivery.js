// Ephemeral presentation only: the full reply is always saved in case history.
export function createReplyDelivery({
  onRelease = () => {},
  onSlow = () => {},
  waitMs = 15000,
} = {}) {
  let pending = null,
    timer = null;
  function release(message) {
    if (!pending || pending.message !== message) return;
    const item = pending;
    pending = null;
    clearTimeout(timer);
    onRelease(item);
  }
  return {
    prepare(message, caseId) {
      if (pending) release(pending.message);
      pending = { message, caseId };
      timer = setTimeout(() => {
        if (pending?.message !== message) return;
        release(message);
        onSlow();
      }, waitMs);
    },
    isPending: (message) => !!pending && pending.message === message,
    release,
  };
}

// Presentation pacing only. Never describe this pause as additional inference.
export async function waitForReplyPreparation({startedAt,signal,urgent=false,onWait=()=>{}}){
 if(signal?.aborted)throw new DOMException('Request cancelled','AbortError');
 const remaining=urgent?0:Math.max(0,5000-(performance.now()-startedAt));
 if(!remaining)return;
 onWait();
 await new Promise((resolve,reject)=>{
  const cancel=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);reject(new DOMException('Request cancelled','AbortError'));};
  const timer=setTimeout(()=>{signal?.removeEventListener('abort',cancel);resolve();},remaining);
  signal?.addEventListener('abort',cancel,{once:true});
 });
}
