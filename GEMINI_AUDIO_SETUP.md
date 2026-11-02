# Use Gemini instead of CLAP for audio

Gemini is an optional **audio** provider. It describes tentative audible events and transcribes intelligible speech. Your existing text-chat and image/frame provider settings stay separate; keep your working `CHAT_*` and `VISION_MODEL` values. This is not a vehicle-diagnosis model.

## 1. Add the private configuration

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). In your existing private `.env`, add or update these entries once, without deleting your other settings:

```dotenv
AUDIO_PROVIDER=gemini
GEMINI_API_KEY=YOUR_PRIVATE_GEMINI_KEY
GEMINI_AUDIO_MODEL=gemini-3.8-flash
GEMINI_AUDIO_MAX_SECONDS=30
ENABLE_AUDIO_CLAP=0
ENABLE_SPEECH_TRANSCRIPTION=0
FFMPEG_PATH=ffmpeg
```

Replace the key placeholder in your local file only. Do not put the key in frontend files, GitHub, chat or screenshots. `ENABLE_SPEECH_TRANSCRIPTION=0` disables the separate local Whisper process; Gemini can still return a transcript.

The model above is an example from Google's current official audio cookbook, not a guarantee of access or free quota. Verify that your Google project can use it, supports audio input via `generateContent`, and has an acceptable current price/quota. No billing is enabled by this code. To list model names available to your key, run from the project root:

```powershell
node scripts/list_gemini_models.js
```

This lists names supporting `generateContent`; it does not independently establish that every listed model accepts audio or is free. If your chosen model differs, set `GEMINI_AUDIO_MODEL` to that exact model ID. A 404/model-unavailable error means you should check the selected ID and project access.

Official references:

- [Audio documentation](https://ai.google.dev/gemini-api/docs/audio)
- [Current official audio cookbook](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Audio.ipynb)
- [Official generateContent audio examples](https://github.com/google-gemini/cookbook/blob/archive/generate-content-api/quickstarts/Audio.ipynb)
- [Pricing and free-tier limits](https://ai.google.dev/gemini-api/docs/pricing)

## 2. Install and start on Windows

Run from the folder containing `package.json`:

```powershell
npm.cmd install
ffmpeg -version
npm.cmd run dev
```

If `ffmpeg` is not found, install FFmpeg and put it on PATH, or set `FFMPEG_PATH` to the executable's full path. Stop any previous app server with Ctrl+C first. Changes to `.env` require restarting the server.

Open the address printed by your server (normally port 3000), then inspect `/api/media-status` or `/api/model-status`:

- `audio.provider`: `gemini`
- `audio.configured`: `true`
- `audio.model`: your selected model
- `ffmpegReady`: `true` on the media-status route

`configured: true` proves only that a key is present and the configuration is parseable. Send an actual short recording to verify inference. Start with spoken Arabic, a non-speech sound, silence and a short video. The app should distinguish words, tentative sound descriptions and failure; it must not turn waveform metrics into an identified fault.

## What is sent and what happens on failure

When you press Send, the existing upload goes to your Node server. FFmpeg produces a mono 16 kHz WAV excerpt. **Only the first 30 seconds at most** are sent to Google by default; the rest of a longer recording is not analyzed by Gemini. The limit is configurable from 1–60 seconds. For video, the audio track is extracted and sent separately; existing visual frames continue to use your configured vision provider.

The server uses HTTPS and `x-goog-api-key`, with the key in a header rather than a URL query. It does not use Google's persistent Files API. Local temporary uploads/excerpts are removed after processing, including errors. Google's own service data-handling terms still apply. Returned descriptions and transcripts are model-generated and may be wrong.

Gemini selection bypasses CLAP, even if an old `ENABLE_AUDIO_CLAP=1` remains. There is no hidden switch to another hosted provider. If Gemini fails, the response reports failed audio recognition and may retain local waveform measurements; those measurements cannot identify a noise. Missing/denied keys, unavailable models, quota errors, timeouts and malformed responses are distinguished without returning provider error bodies or secrets.

To return to the local pipeline:

```dotenv
AUDIO_PROVIDER=local
```

Then explicitly enable CLAP and/or Whisper only if their local dependencies are installed.

## Cloud/proxy environments

The API needs HTTPS access to `generativelanguage.googleapis.com` and a server-side `GEMINI_API_KEY`. Configure both through your environment's supported settings. For a Node 24 runtime using injected HTTP(S) proxies, enable Node's environment-proxy support at startup; preserve CA verification. On a Windows PC with ordinary Internet access, use the normal startup command above.

## Validation of this change

Nine new tests cover configuration, secret isolation, requests with real WAV bytes, Arabic transcripts, silence, quota/access/model failures, real FFmpeg audio/video extraction, waveform fallback, and the real chat route consuming Gemini observations. Google responses were mocked: **no live Gemini inference, account entitlement or free quota was verified** because no Gemini key was supplied.

Run `npm.cmd run check` and `npm.cmd test`. Optional FFmpeg integration tests explicitly skip if FFmpeg is absent; they ran and passed in the prepared environment. The existing unrelated source-string failure in `tests/carAudioCatalog.test.js:32` remains and was not weakened.

## Temporary provider errors

Gemini HTTP 500/502/503/504 responses receive up to two additional attempts using the same model and audio excerpt, within one 60-second request deadline. Short `Retry-After` instructions are honored; longer delays are reported for a later manual retry. API keys, model-not-found responses, and quota errors are not automatically retried. This cannot repair an outage or grant access to a model.

If it still fails, share the displayed **HTTP status** and your selected **model name**, without keys. Run `node scripts/list_gemini_models.js` to check model metadata access for your project. Listing a model does not prove audio input support or available inference quota.

## Independent speech fallback

If Gemini cannot supply intelligible speech or a clear sound event, `SPEECH_FALLBACK=auto` can reuse an existing Groq chat configuration for Whisper speech-to-text, or local Whisper when explicitly enabled. This uses a separate status from sound recognition, preserves Arabic/English words, and displays a correctable transcript. Provider audio disclosure and configuration are detailed in [YOUTUBE_SHORTS_RESEARCH.md](YOUTUBE_SHORTS_RESEARCH.md). Set `SPEECH_FALLBACK=none` to disable it.

## Compare against the two uploaded compilations

The repository now bundles 15 actual short WAV excerpts with bilingual **uploader labels**, provenance and hashes in [data/uploaded_audio_references/README.md](data/uploaded_audio_references/README.md). With Gemini enabled, direct target/reference audio comparison is on by default (`GEMINI_REFERENCE_AUDIO=1`). It adds approximately 33 seconds of reference audio input per request. Set the flag to `0` for ordinary target-only audio analysis. No model is trained, and no live Gemini comparisons were run during this change because a usable key was not supplied in the cloud environment.

A single clear reference resemblance gives a tentative explanation without a reflexive question. Partial/no/unclear matches describe the sound and permit one useful missing-context question within the existing case question budget. Reference titles cannot verify faulty parts. Original-language target transcription remains separate from reference speech. To use locally, keep your private Gemini key and working audio model in `.env`, update the branch, then restart `npm.cmd run dev`.

## Human vocal imitations

Gemini is prompted to mark a deliberate mouth-made car/engine imitation only when identifiable vocal articulation/breath supports it. Ordinary speech, a person talking over an actual engine, synthetic sounds and uncertain recordings are not positive detections. Accepted detections include an audible explanation and cannot be promoted into reference component matches. An explicit recording-analysis request can receive a short friendly Arabic/English V8 joke, with an invitation to send the actual car recording. Intelligible user speech, active interview answers, failed analysis and urgent fault context bypass joking. No live accuracy evaluation of this detection was possible without a cloud Gemini key; tests use controlled provider responses.
