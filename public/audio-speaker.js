// Playback and mouth movement share the actual audio clock, not a speech timer.
// No keys, transcript or history are persisted here.
export function createAudioSpeaker({
  onState,
  onMouth,
  onError,
  onSyncUnavailable = () => {},
}) {
  let audio = null,
    url = null,
    context = null,
    frame = null,
    generation = 0,
    opening = 0.12;
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  function mouthClosed() {
    opening = 0.12;
    onMouth(0.12);
  }
  function prepare() {
    if (context || !Context) return;
    try {
      context = new Context();
      void context.resume().catch(() => {});
    } catch {
      context = null;
    }
  }
  function stop() {
    generation++;
    cancelAnimationFrame(frame);
    mouthClosed();
    if (audio) {
      audio.onplaying =
        audio.onpause =
        audio.onended =
        audio.onerror =
        audio.onwaiting =
          null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio = null;
    }
    if (url) {
      URL.revokeObjectURL(url);
      url = null;
    }
    if (context) {
      void context.close().catch(() => {});
      context = null;
    }
  }
  async function play(blob) {
    const id = generation;
    if (!context) prepare();
    url = URL.createObjectURL(blob);
    audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = 1;
    audio.muted = false;
    let analyser = null,
      data = null;
    // A suspended Web Audio graph would make a moving HTML player silent.
    // Route through it only when running; otherwise retain normal media output.
    let source = null;
    if (context?.state === "running") {
      try {
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        data = new Float32Array(analyser.fftSize);
        source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
      } catch {
        analyser = null;
        if (source) {
          audio.removeAttribute("src");
          audio.load();
          audio = new Audio(url);
          void context.close().catch(() => {});
          context = null;
        }
      }
    }
    function animate() {
      if (id !== generation || !audio || audio.paused) return;
      if (analyser && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        analyser.getFloatTimeDomainData(data);
        const rms = Math.sqrt(
          data.reduce((sum, n) => sum + n * n, 0) / data.length,
        );
        // Gentle attack/release; silence closes the mouth rather than looping.
        const target = rms < 0.008 ? 0.12 : Math.min(1.9, 0.12 + rms * 13);
        opening += (target - opening) * (target > opening ? 0.5 : 0.3);
        onMouth(opening);
      } else mouthClosed();
      frame = requestAnimationFrame(animate);
    }
    audio.onplaying = () => {
      if (id !== generation) return;
      onState("speaking");
      if (!analyser) onSyncUnavailable();
      cancelAnimationFrame(frame);
      animate();
    };
    audio.onpause = () => {
      if (id !== generation || !audio || audio.ended) return;
      cancelAnimationFrame(frame);
      mouthClosed();
      onState("paused");
    };
    audio.onwaiting = () => {
      if (id !== generation) return;
      cancelAnimationFrame(frame);
      mouthClosed();
      onState("loading");
    };
    audio.onended = () => {
      if (id !== generation) return;
      stop();
      onState("idle");
    };
    audio.onerror = () => {
      if (id !== generation) return;
      stop();
      onError("failed");
    };
    try {
      await audio.play();
    } catch (error) {
      if (id === generation) {
        stop();
        onError(error.name === "NotAllowedError" ? "blocked" : "failed");
      }
    }
  }
  function pause() {
    audio?.pause();
  }
  function resume() {
    if (audio) void audio.play().catch(() => onError("blocked"));
  }
  return { prepare, play, stop, pause, resume, active: () => !!audio };
}
