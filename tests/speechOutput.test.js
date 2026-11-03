import test from "node:test";
import assert from "node:assert/strict";
import { speechConfiguration, generateSpeech } from "../server/speech.js";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const env = { GEMINI_API_KEY: "fixture-secret" };
const pcm = Buffer.alloc(4800);
for (let i = 0; i < 2400; i++)
  pcm.writeInt16LE(
    Math.round(6000 * Math.sin((i * 2 * Math.PI * 440) / 24000)),
    i * 2,
  );
const ok = (inlineData) => ({
  ok: true,
  json: async () => ({
    candidates: [
      { finishReason: "STOP", content: { parts: [{ inlineData }] } },
    ],
  }),
});
test("natural speech sends only target text in Saudi Arabic with a prebuilt voice and returns playable PCM WAV", async () => {
  let request;
  const wav = await generateSpeech("هلا، خلنا نفهم صوت سيارتك.", "en", {
    env,
    fetchImpl: async (url, r) => {
      request = { url, ...r };
      return ok({
        mimeType: "audio/L16;codec=pcm;rate=24000",
        data: pcm.toString("base64"),
      });
    },
  });
  const body = JSON.parse(request.body);
  assert.match(request.url, /gemini-3.1-flash-tts-preview:generateContent$/);
  assert.equal(request.headers["x-goog-api-key"], env.GEMINI_API_KEY);
  assert.match(body.contents[0].parts[0].text, /سعودية/);
  assert.match(body.contents[0].parts[0].text, /Do not translate/);
  assert.equal(
    body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig
      .voiceName,
    "Charon",
  );
  assert.equal(body.contents[0].parts.length, 1);
  assert.equal(body.generationConfig.responseModalities[0], "AUDIO");
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.deepEqual(wav.subarray(44), pcm);
  assert.ok(
    !JSON.stringify(speechConfiguration(env)).includes(env.GEMINI_API_KEY),
  );
});
test("English and voice changes are honored and existing WAV is not wrapped twice", async () => {
  const wav = await generateSpeech("Hello", "ar", {
    env,
    voice: "Enceladus",
    fetchImpl: async (_, r) => {
      const body = JSON.parse(r.body);
      assert.equal(
        body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig
          .voiceName,
        "Enceladus",
      );
      assert.match(body.contents[0].parts[0].text, /English/);
      return ok({
        mimeType: "audio/L16;rate=24000",
        data: pcm.toString("base64"),
      });
    },
  });
  assert.deepEqual(
    await generateSpeech("Hello", "en", {
      env,
      fetchImpl: async () =>
        ok({ mimeType: "audio/wav", data: wav.toString("base64") }),
    }),
    wav,
  );
});
test("missing key, oversized input, unsupported voices and provider errors never become fake playable audio", async () => {
  await assert.rejects(
    () => generateSpeech("hi", "ar", { env: {} }),
    (e) => e.code === "SPEECH_KEY_MISSING",
  );
  await assert.rejects(
    () => generateSpeech("x".repeat(1901), "ar", { env }),
    /1900/,
  );
  await assert.rejects(
    () => generateSpeech("hi", "ar", { env, voice: "invented" }),
    /voice/,
  );
  for (const status of [401, 403, 404, 429, 503])
    await assert.rejects(
      () =>
        generateSpeech("hi", "ar", {
          env,
          fetchImpl: async () => ({ ok: false, status }),
        }),
      (e) =>
        e.message.includes(String(status)) &&
        !e.message.includes(env.GEMINI_API_KEY),
    );
  for (const part of [
    { mimeType: "text/plain", data: "aGk=" },
    { mimeType: "audio/L16", data: "" },
    { mimeType: "audio/L16;rate=1", data: pcm.toString("base64") },
  ])
    await assert.rejects(
      () =>
        generateSpeech("hi", "ar", { env, fetchImpl: async () => ok(part) }),
      /audio|rate/,
    );
  await assert.rejects(
    () =>
      generateSpeech("hi", "ar", {
        env,
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ promptFeedback: { blockReason: "blocked" } }),
        }),
      }),
    /no complete/,
  );
});
test("streamed provider bodies are bounded before JSON/audio decoding", async () => {
  let cancelled = false;
  const result = {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => ({
          done: false,
          value: Buffer.alloc(13 * 1024 * 1024),
        }),
        cancel: async () => {
          cancelled = true;
        },
      }),
    },
  };
  await assert.rejects(
    () => generateSpeech("hi", "en", { env, fetchImpl: async () => result }),
    /Invalid Gemini speech response/,
  );
  assert.equal(cancelled, true);
});
test("client cancellation reaches the Gemini request signal", async () => {
  const c = new AbortController();
  c.abort();
  await assert.rejects(
    () =>
      generateSpeech("hi", "en", {
        env,
        signal: c.signal,
        fetchImpl: async (_, r) => {
          assert.equal(r.signal.aborted, true);
          throw new DOMException("cancelled", "AbortError");
        },
      }),
    /Cannot reach/,
  );
});
test("speech HTTP endpoint returns safe configuration and errors without needing any native Arabic voice", async (t) => {
  const probe = http.createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const child = spawn(process.execPath, ["server/index.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, PORT: String(port), GEMINI_API_KEY: "" },
    stdio: "ignore",
  });
  t.after(() => child.kill());
  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try {
      if ((await fetch(base + "/api/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.ok(ready);
  const status = await fetch(base + "/api/speech/status");
  assert.equal(status.headers.get("cache-control"), "no-store");
  const config = await status.json();
  assert.equal(config.configured, false);
  assert.equal(config.voice, "Charon");
  assert.ok(!JSON.stringify(config).includes("API_KEY"));
  let result = await fetch(base + "/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "هلا", language: "ar" }),
  });
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, "SPEECH_KEY_MISSING");
  result = await fetch(base + "/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "x".repeat(1901) }),
  });
  assert.equal(result.status, 400);
});

test("successful HTTP speech returns WAV with no-store and never forwards supplied history/media fields", async (t) => {
  const probe = http.createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const payload = {
    candidates: [
      {
        finishReason: "STOP",
        content: {
          parts: [
            {
              inlineData: {
                mimeType: "audio/L16;rate=24000",
                data: pcm.toString("base64"),
              },
            },
          ],
        },
      },
    ],
  };
  const stub = `const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(String(url).startsWith('https://generativelanguage.googleapis.com/')){const body=JSON.parse(options.body);if(JSON.stringify(body).includes('do-not-forward'))throw Error('Unexpected conversation export');if(options.headers['x-goog-api-key']!=='fixture-key')throw Error('Missing header auth');return Response.json(${JSON.stringify(payload)});}return original(url,options);};`;
  const child = spawn(
    process.execPath,
    [
      "--import",
      "data:text/javascript," + encodeURIComponent(stub),
      "server/index.js",
    ],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: {
        ...process.env,
        PORT: String(port),
        GEMINI_API_KEY: "fixture-key",
        GEMINI_TTS_MODEL: "gemini-3.1-flash-tts-preview",
        GEMINI_TTS_VOICE: "Charon",
      },
      stdio: "ignore",
    },
  );
  t.after(() => child.kill());
  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try {
      if ((await fetch(base + "/api/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.ok(ready);
  const result = await fetch(base + "/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "هلا، خلنا نفهم صوت سيارتك.",
      language: "ar",
      voice: "Charon",
      history: "do-not-forward",
      media: "do-not-forward",
    }),
  });
  assert.equal(result.status, 200);
  assert.match(result.headers.get("content-type"), /audio\/wav/);
  assert.equal(result.headers.get("cache-control"), "no-store");
  const bytes = Buffer.from(await result.arrayBuffer());
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.deepEqual(bytes.subarray(44), pcm);
});
