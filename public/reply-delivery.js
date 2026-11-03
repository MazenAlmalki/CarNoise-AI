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
