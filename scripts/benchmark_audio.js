import { readFile } from "node:fs/promises";
import { analyzeUploadedMedia } from "../server/multimodal.js";
// Reproducible local preparation benchmark. Provider delay is a labelled fixture,
// not a Gemini speed/recognition test. No credentials or network calls are used.
const buffer = await readFile(
  process.argv[2] ||
    new URL(
      "../data/uploaded_audio_references/upload1-01.wav",
      import.meta.url,
    ),
);
const env = {
  AUDIO_PROVIDER: "gemini",
  GEMINI_API_KEY: "benchmark-fixture-only",
  GEMINI_AUDIO_MODEL: "fixture",
  GEMINI_AUDIO_MAX_SECONDS: "30",
  SPEECH_FALLBACK: "none",
};
const fetchImpl = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                text: JSON.stringify({
                  hasSpeech: false,
                  transcript: "",
                  hasClearSound: false,
                  description: "Benchmark fixture only; not an observation.",
                  sounds: [],
                  acousticCategories: [],
                  uncertainty: "No recognition performed.",
                  referenceComparison: {
                    result: "unclear",
                    referenceIds: [],
                    reason: "Fixture response, not recognition.",
                  },
                }),
              },
            ],
          },
        },
      ],
    }),
  };
};
const runs = [];
for (let i = 0; i < 5; i++) {
  const result = await analyzeUploadedMedia(
    { buffer, size: buffer.length, mimetype: "audio/wav" },
    "en",
    { env, fetchImpl },
  );
  runs.push(result.timings);
}
console.log(
  JSON.stringify(
    {
      scope:
        "Local decoding, reference preparation and a simulated 200ms provider; NOT live Gemini latency or accuracy",
      runs,
      meanTotalMs: runs.reduce((sum, r) => sum + r.totalMs, 0) / runs.length,
    },
    null,
    2,
  ),
);
