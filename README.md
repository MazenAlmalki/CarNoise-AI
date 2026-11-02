# ورشتك | Warshatak

An Arabic-first vehicle-noise assistant with English support, a mechanic-themed interface, per-vehicle conversations, and text, microphone, audio, photo and video attachments. Its responses explore possibilities; they are not mechanic-confirmed diagnoses.

## Run on Windows

Requires Node.js 20 or newer. FFmpeg is needed for recording/video decoding and Gemini audio excerpts. Local CLAP/Whisper additionally need their optional Python dependencies.

From the folder containing `package.json`:

```powershell
npm.cmd install
# First-time setup only: preserve any existing private configuration.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit your private `.env` to select your providers, then start:

```powershell
ffmpeg -version
npm.cmd run dev
```

Open the server address (normally port 3000). Use `npm.cmd start` without watch mode. Restart the server after changing `.env`. On macOS/Linux use `npm` instead of `npm.cmd`.

## Configure the providers

| Feature | Configuration | Guide |
| --- | --- | --- |
| Text chat | `CHAT_API_URL`, `CHAT_API_KEY`, `CHAT_MODEL` for your compatible provider | [Hosted chat setup](HOSTED_LLAMA_API_SETUP.md) |
| Audio descriptions and speech | `AUDIO_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_AUDIO_MODEL` | [Gemini setup](GEMINI_AUDIO_SETUP.md) |
| Local audio processing | `AUDIO_PROVIDER=local`, optional CLAP/Whisper flags | [Local media setup](MULTIMODAL_SETUP.md) |
| Images/video frames | `VISION_MODEL`, using the configured chat endpoint and key | [Text/vision context setup](LLAMA_CONTEXT_ENGINE_SETUP.md) |

Keep existing working provider settings when adding Gemini. A model name must be available to your provider/project and support the required input type. A working text endpoint does not establish vision support. Current prices and quotas depend on the chosen provider/model; a ChatGPT subscription does not supply those API credits.

The default template uses hosted Meta Llama text/vision. Gemini is optional and does not change the text or vision provider. With Gemini selected, CLAP is bypassed. To list Gemini model metadata without displaying your key:

```powershell
node scripts/list_gemini_models.js
```

## What the app does

- Arabic/RTL and English/LTR, light/dark themes, responsive navigation and reduced-motion support.
- Vehicle folders and conversation history stored in the current browser.
- Recording and media previews before Send; attachments can be added during a conversation.
- Context assembled from the user's descriptions, bounded history and source-linked reference material.
- Tentative sound descriptions through Gemini, or optional local CLAP similarities and Whisper transcripts.
- Local FFmpeg waveform measurements and extracted video frames.

A waveform does not identify a sound or vehicle fault. CLAP scores are not fault probabilities. Hosted observations/transcripts can also be wrong. Video images do not establish what its audio contains. The app reports unsuccessful analysis instead of claiming it understood the clip.

## Privacy

Conversation state stays in this browser's localStorage; attachments stay in its IndexedDB. This is not a synced cloud account, and clearing browser storage can erase that data.

On Send, messages and relevant context reach your selected chat provider. Attachments upload temporarily to the Node server. Images/frames may reach the vision provider; when Gemini audio is selected, a bounded audio excerpt reaches Google (first 30 seconds at most by default). Local temporary media is removed after processing, including errors. Providers' own data-handling terms still apply. API keys belong only in private server configuration, never in frontend files, screenshots or GitHub.

## Readiness and errors

`/api/model-status` and `/api/media-status` show provider configuration and FFmpeg availability. `configured: true` means a key is present; it does not prove authorization, quota or successful inference. Verify with an actual short recording or image.

- **Failed to fetch:** check that the app server is running and the browser uses its address, rather than an HTML file or an unrelated Live Server port.
- **Missing/denied key:** check the appropriate provider key in `.env` and restart.
- **Model unavailable:** choose a supported model returned for your account/project.
- **Gemini HTTP 500/502/503/504:** the app retries transient failures up to twice within one deadline; an exhausted request reports the HTTP code. Long `Retry-After` instructions are left for a later manual retry.
- **Quota/rate limit:** check your provider's limits. The app does not automatically retry 429 errors or enable billing.
- **FFmpeg missing:** install it on PATH or set `FFMPEG_PATH` to the executable.

## API and validation

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Server health and text-provider configuration |
| `GET /api/model-status` | Provider configuration metadata |
| `GET /api/media-status` | Media configuration and FFmpeg availability |
| `POST /api/chat` | Conversation and bounded reference retrieval |
| `POST /api/media/analyze` | Multipart attachment analysis (`media` field, up to 25 MB) |
| `POST /api/analyze` | Compatibility with older four-question records |

```powershell
npm.cmd run check
npm.cmd test
```

Gemini tests use mocked provider responses and real local FFmpeg when available; live provider access must be checked with your own key. Optional FFmpeg integration tests report a skip if it is absent. An existing source-string assertion in `tests/carAudioCatalog.test.js:32` is a known baseline failure.

## Further documentation

- [Frontend design and behavior](FRONTEND_DESIGN.md)
- [Question limits and evidence retrieval](MINIMAL_QUESTIONS_AND_EVIDENCE.md)
- [Saudi vocabulary](SAUDI_CAR_TERMS_AND_ENGLISH.md) and [dialect guide](SAUDI_DIALECT_GUIDE.md)
- [Reference sources and licensing](REFERENCES.md), [data collection](DATA_COLLECTION_GUIDE.md), and [sound research](SOUND_RESEARCH_AND_GUIDED_QUESTIONS.md)
- [Development history](UPDATES.md)

The reference corpora include synthetic language examples and educational source summaries. They are not verified vehicle-fault training labels or evidence that a particular recording matches a video.
