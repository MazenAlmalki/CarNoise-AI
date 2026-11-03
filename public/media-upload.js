// Upload completion is a real browser event; it is not analysis completion.
export function uploadMedia(payload, { signal, onUploaded = () => {} } = {}) {
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
