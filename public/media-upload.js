// Upload completion is a real browser event; it is not analysis completion.
export function uploadMedia(payload, { signal, onUploaded = () => {}, onProgress = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload cancelled.", "AbortError"));
      return;
    }
    const request = new XMLHttpRequest();
    request.open("POST", "/api/media/analyze");
    request.responseType = "json";
    const abort = () => request.abort();
    const clean = () => signal?.removeEventListener("abort", abort);
    request.upload.onprogress = event => {
      if (!signal?.aborted && event.lengthComputable && event.total > 0)
        onProgress({loaded:event.loaded,total:event.total,percent:Math.floor(Math.min(100,Math.max(0,event.loaded/event.total*100)))});
    };
    request.upload.onload = () => {
      if (!signal?.aborted) onUploaded();
    };
    request.onload = () => {
      clean();
      resolve({
        ok: request.status >= 200 && request.status < 300,
        body: request.response || {},
      });
    };
    request.onerror = () => {
      clean();
      reject(new TypeError("Media network request failed."));
    };
    request.onabort = () => {
      clean();
      reject(new DOMException("Upload cancelled.", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    request.send(payload);
  });
}
