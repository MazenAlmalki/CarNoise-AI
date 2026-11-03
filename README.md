# ورشتك | Warshatak

Arabic/English vehicle assistant built with Node.js/Express and plain HTML/CSS/JavaScript. Results suggest possibilities and inspection steps, not confirmed diagnoses.

## Run

Requires Node.js 20+ and, for decoding audio/video or dictation, FFmpeg on PATH.

```powershell
npm.cmd install
# First-time setup only; preserve existing private configuration.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Open `http://localhost:3000`. Use `npm.cmd start` without watch mode. On Linux/macOS use `npm`. Restart after editing `.env`; never commit keys.

## Provider configuration

Only configure the features you use. Model names in `.env.example` are defaults, not proof of availability: verify model/input support and quota for your account.

| Feature | Settings |
| --- | --- |
| Text chat | `CHAT_API_URL`, `CHAT_API_KEY`, `CHAT_MODEL` (OpenAI-compatible endpoint) |
| Images/video frames | `VISION_MODEL`, using the chat endpoint/key; requires vision support |
| Attached audio understanding | `AUDIO_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_AUDIO_MODEL` |
| Microphone dictation | `SPEECH_FALLBACK=groq`, `GROQ_API_KEY`, `GROQ_SPEECH_MODEL`; `SPEECH_LANGUAGE=auto` for Arabic/English |
| Optional local transcription | `SPEECH_FALLBACK=local`, `ENABLE_SPEECH_TRANSCRIPTION=1`, `AUDIO_PYTHON`, `WHISPER_MODEL`; requires faster-whisper and model files |
| Read aloud | Browser/system voices, or Gemini TTS using `GEMINI_API_KEY`, `GEMINI_TTS_MODEL`, `GEMINI_TTS_VOICE` |

`SPEECH_FALLBACK=none` disables dictation. `auto` reuses a Groq chat key only when the chat host is `api.groq.com`, or enabled local Whisper. Missing ASR produces an unavailable message, never a vehicle-analysis fallback. Dictation is limited to 60 seconds / 5 MiB.

`AUDIO_PROVIDER=local` defaults to decoding/measurements with optional CLAP/Whisper disabled. Waveform measurements cannot identify a sound. Optional CLAP needs Python dependencies/model files and is similarity scoring, not a trained fault classifier. With Gemini selected CLAP is bypassed. `FFMPEG_PATH` overrides FFmpeg; `GEMINI_AUDIO_MAX_SECONDS` bounds target audio (30 seconds by default). `GEMINI_REFERENCE_AUDIO=0` disables the additional reference-audio comparison. Inspect available Gemini model metadata with `node scripts/list_gemini_models.js`; metadata alone does not validate inference.

## User flows and limits

- **Microphone → editable text draft → explicit Send.** Existing typed text is preserved. Stopping does not create a chat message or save microphone audio as an attachment. Cancel/navigation stops capture and ignores stale results.
- **Attach → preview → explicit Send.** Images/audio/video upload only on Send, up to 25 MiB. Written descriptions and automatic transcripts remain separate.
- Attached audio observations distinguish speech, mechanical sounds, mixed, music, silence, other and uncertain. Mechanical does not establish a vehicle fault; missing/failed analysis cannot supply a diagnosis.
- Fifteen bundled reference excerpts support optional native-audio comparison. Four registered recordings also support exact file identity without an API/FFmpeg, or exact decoded-PCM identity with FFmpeg. Identity is not recognition of new similar sounds; source labels remain unverified uploader claims.
- Possible matches include inspection guidance and sources; unclear or unmatched clips can return **No reliable match**. No invented probabilities, validated 70% threshold, training or reliable fault-classifier claim.
- Presentation minimums are 5 seconds for text and 30 seconds for attachment results, with safety responses exempt. These are UI delays, not evidence of analysis time.

## Storage and privacy

History/vehicles live in browser localStorage and attachments in IndexedDB. Clearing browser data may erase them; no synced account is implemented. On Send, messages/context reach the configured chat provider. Uploaded media is processed temporarily on the server; images/frames may reach the vision provider and bounded audio may reach Google or Groq according to settings. Dictation recordings are temporary. Server temporary files are removed after processing/errors; provider retention terms still apply. Keep credentials server-side.

## API routes

These routes support current UI features or saved-case compatibility and are retained:

| Route | Purpose |
| --- | --- |
| `GET /api/health`, `/api/model-status`, `/api/media-status` | Health/configuration and media readiness |
| `POST /api/chat` | Conversation |
| `POST /api/analyze` | Older saved-case analysis compatibility |
| `POST /api/media/analyze` | Attached-file analysis (`media` field) |
| `GET /api/audio-references/:id` | Allowlisted reference playback |
| `GET /api/speech/transcription-status` | Dictation configuration |
| `POST /api/speech/transcribe` | Temporary dictation (`audio` field) |
| `GET /api/speech/status`, `POST /api/speech` | Read-aloud configuration and generation |

`configured: true` establishes configuration only, not successful access. Connection errors: start the server and use its address. Quota/429 errors: check provider limits; creating another key does not guarantee more quota. Missing decoder: install FFmpeg or set its path. Do not paste secrets into chat.

## Verify

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run evaluate:audio
```

Node/provider mocks verify routing, contracts and failure handling, not recognition accuracy. Browser smoke scripts in `scripts/smoke_*.cjs` use Playwright/Chromium (`PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `SMOKE_URL`); see each script for options. No live provider success or acoustic accuracy follows from mocked tests.

Audio evaluation currently reports **blocked** (exit 2): independent reviewed recordings are missing. All clips from one source must stay in the same reference/test group. No training, ingestion or model downloads run as part of cleanup.

## Essential documentation

- [Actual stack, APIs and data — Arabic](PROJECT_STACK_AR.md)
- [Sources and licensing](REFERENCES.md)
- [Reference timestamps, hashes and labels](data/uploaded_audio_references/README.md)
- [Independent evaluation requirements](data/car-audio/README.md)
- [Business model](BUSINESS_MODEL.md) and [Arabic canvas, PDF/PNG/HTML](docs/business/CANVAS_README.md)

Historical review/prompt documents and unused YouTube/dataset-import tools were removed. Runtime references, source hashes, evaluation metadata, tests and business artifacts remain in the repository; deleted history is recoverable through Git.
