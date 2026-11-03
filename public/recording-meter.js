// Actual microphone energy. This graph is never connected to speakers.
export function createRecordingMeter({
  onLevel = () => {},
  onUnavailable = () => {},
} = {}) {
  let context = null,
    frame = null,
    source = null,
    generation = 0;
  function stop() {
    generation++;
    cancelAnimationFrame(frame);
    source?.disconnect();
    source = null;
    if (context) void context.close().catch(() => {});
    context = null;
    onLevel(0);
  }
  async function start(stream) {
    stop();
    const id = generation,
      Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) {
      onUnavailable();
      return;
    }
    try {
      const current = new Context();
      context = current;
      await current.resume();
      if (id !== generation) return;
      if (current.state !== "running") throw Error("Meter unavailable");
      const analyser = current.createAnalyser();
      analyser.fftSize = 512;
      source = current.createMediaStreamSource(stream);
      source.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let smooth = 0;
      function tick() {
        if (id !== generation) return;
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(
          samples.reduce((sum, n) => sum + n * n, 0) / samples.length,
        );
        smooth = smooth * 0.6 + Math.min(1, rms * 9) * 0.4;
        onLevel(smooth);
        frame = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      if (id === generation) {
        stop();
        onUnavailable();
      }
    }
  }
  return { start, stop };
}
