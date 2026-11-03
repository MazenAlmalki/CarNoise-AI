// Monotonic, content-free measurements. Failed stages still have a duration.
export function createTimings() {
  const started = performance.now(),
    stages = {};
  return {
    async measure(name, work) {
      const start = performance.now();
      try {
        const value = await work();
        stages[name] = {
          ms: Math.round(performance.now() - start),
          status: "ok",
        };
        return value;
      } catch (error) {
        stages[name] = {
          ms: Math.round(performance.now() - start),
          status: "error",
        };
        throw error;
      }
    },
    snapshot() {
      return {
        totalMs: Math.round(performance.now() - started),
        stages: { ...stages },
      };
    },
  };
}
