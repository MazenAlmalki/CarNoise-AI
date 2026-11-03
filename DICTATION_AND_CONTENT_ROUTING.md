# Dictation and attachment audio routing

This change continues `2668eca` on `codex/gemini-audio-provider`. The checkout was clean when inspected. No prior local edits were discarded.

## Cause found

The microphone button previously called `mediaFile(...)` after stopping. Sending the conversation then saved that recording in IndexedDB and sent it to `/api/media/analyze`, exactly like an attached car clip. If sound inference failed or returned no usable event, the chat route could begin a vehicle-location interview. A waveform-only result did not establish that the recording was a vehicle, speech, silence or anything else.

In this cloud instance, no private `.env` or injected Gemini/Groq/chat key was present. With defaults, `AUDIO_PROVIDER=local`, CLAP and local Whisper are disabled: FFmpeg can decode/measure a recording but cannot recognize its contents. This explains the available runtime path here; it does not establish the settings or exact failure on a user's separate laptop.

## Two separate flows

**Microphone → dictation → editable draft → explicit Send.** The button is now “إملاء صوتي” / “Dictate”. Stopping uploads a temporary recording only to `POST /api/speech/transcribe`. It never calls Gemini sound recognition, loads references, saves the microphone recording as case media or automatically calls chat. Text appears in the current draft, with a newline after existing text. Edits made during ASR are preserved. Enter sends; Shift+Enter adds a line. If the combined text exceeds the existing draft limit, the draft stays intact and the complete transcript appears separately for copying rather than being truncated.

Cancel, vehicle/thread navigation, language changes and page exit stop tracks and invalidate pending results. A late response cannot populate a different thread. Recording stops at one minute; live bytes are capped at 5 MiB. ASR waiting has a two-minute client deadline and is cancellable. Missing ASR, silence, uncertain segments and errors produce no invented text or vehicle diagnosis. Recording/capture pending states prevent accidental submission.

**Attach file → preview → explicit Send → media analysis.** Existing audio/video/image upload behavior remains. Files are not uploaded merely by selecting them. Written details stay separate from automatic transcripts. Attached media may still contain ordinary speech, music or silence and is not presumed automotive.

## ASR configuration

Dictation reuses the existing speech-transcription implementation and model settings; no new model identifier or weights were introduced. `GET /api/speech/transcription-status` reports configuration metadata, not proof of provider access or installed local dependencies.

For an existing Groq account, set these in your private environment settings / `.env`:

```dotenv
SPEECH_FALLBACK=groq
SPEECH_LANGUAGE=auto
# Supply GROQ_API_KEY securely, never in chat or committed files.
```

The existing `GROQ_SPEECH_MODEL` setting defaults to `whisper-large-v3-turbo`. An existing Groq chat key is reused only if its configured HTTPS chat host is exactly `api.groq.com`; another provider's chat key is never sent there. `SPEECH_LANGUAGE=ar` is an optional Arabic hint; `auto` preserves detected Arabic/English without forcing translation. Saudi-dialect transcription quality remains unmeasured. No Groq key is available here, so model/account access was not verified live.

Alternatively, the already-supported local path uses `SPEECH_FALLBACK=local`, `ENABLE_SPEECH_TRANSCRIPTION=1`, `AUDIO_PYTHON` and `WHISPER_MODEL`. It requires FFmpeg, faster-whisper and actual model files. This task did not install Python speech dependencies or download weights. On Windows, use the configured `AUDIO_PYTHON=python` if appropriate. `SPEECH_FALLBACK=none` deliberately disables dictation. Missing configuration returns HTTP 503 with no sound-model fallback.

The dictation endpoint accepts one supported audio file in multipart field `audio`, at most 5 MiB and 60 decoded seconds. FFmpeg output is bounded, decoded as mono 16 kHz PCM, and the duration is checked before ASR. Temporary input/normalized files are removed on success, failure and cancellation. HTTP client disconnect aborts processing and the hosted request. Results use `Cache-Control: no-store`; text is always marked automatic and requiring user review.

## Preliminary content observations for attached clips

The existing Gemini audio-input request now explicitly asks for:

- `contentType`: `speech`, `mechanical_sound`, `mixed`, `music`, `silence`, `other` or `uncertain`;
- `hasMechanicalSound`: whether a clear mechanical event was actually observed, separately from intelligible words;
- original-language transcript and separate audible-event descriptions/uncertainty.

This is a structured observation within the existing inference request, **not a trained classifier**. `mixed` can mean speech plus music; it does not automatically imply a mechanical event. Even a mechanical event is not proof of a vehicle source or defective part. The server validates the output contract. Failed/missing inference, CLAP similarities and waveform metrics cannot supply this content classification. ASR-only evidence can establish recognized words, but cannot rule out other sounds in the clip.

Speech-only attached greetings follow the recognized words; a spoken complaint stays a user report, not an observed engine noise. When no reliable mechanical event or intelligible speech exists, the chat route returns a neutral explanation instead of a vehicle-location interview, even if a vehicle is selected or the user skips questions. Video frames remain a separate visual channel; visuals alone do not establish a mechanical audio event. Detailed written complaints can still be discussed independently of media failure. Model reference matches from non-mechanical targets are suppressed.

Hosted audio uses the existing Gemini adapter and configured `GEMINI_AUDIO_MODEL`; no replacement model was guessed or introduced. Set `AUDIO_PROVIDER=gemini` and securely configure `GEMINI_API_KEY` only if your selected model/account actually supports native audio and the requested structured response. Existing `scripts/list_gemini_models.js` can inspect account model metadata after access is configured; listings alone do not prove accurate audio understanding. Live model/schema compatibility cannot be established without access.

Cloud live testing additionally needs HTTPS access to `api.groq.com` for Groq ASR and `generativelanguage.googleapis.com` for Gemini. Neither destination is in this running instance's allowed policy, and neither key is present. Add only the provider you intend to use in environment settings, supply its key securely and restart. No live inference/latency/accuracy is claimed from these checks.

## Available earlier media

Found and hash-verified all **15** WAV references listed in `data/uploaded_audio_references/manifest.json` (8 upload1, 7 upload2). `data/car-audio/sources.json` records the two original MP4 source names/hashes, but the MP4 files are not present in this workspace. A separate `public/assets/sound-check.wav` is a UI sound check, not a vehicle diagnosis sample. File/hash verification is not listening or acoustic annotation. Component titles remain **unverified uploader hypotheses**. No new data was collected/ingested and no labels or weights were changed.

## Validation and remaining evidence

From the repository root:

```sh
npm run check
npm test
# Start separately:
PORT=3007 NODE_USE_ENV_PROXY=1 npm start
# In another terminal with environment-installed Playwright and Chromium:
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright SMOKE_URL=http://127.0.0.1:3007 node scripts/smoke_dictation.cjs
```

Existing `smoke_ui.cjs`, `smoke_examples.cjs` and `smoke_speech_sync.cjs` use the same variables and remain applicable. Adapt paths for other installations. The app has no new npm dependency.

Node checks exercise actual FFmpeg decoding, temp cleanup, duration limits, ASR segment filtering, cancellation, missing configuration, HTTP upload errors and content-aware chat routing. Provider responses are **mocks**. The dedicated Chromium test uses real synthetic microphone capture, DOM, storage and cancellation, with mocked ASR/chat/media responses: Arabic/English draft appending, edits during processing, no automatic chat/media/case creation, explicit Enter vs Shift+Enter, recording/ASR cancellation, late navigation, silence/errors, overflow preservation and attachment upload only after Send. Responsive checks cover 320–1440 px. Existing browser tests cover history/vehicles, reference playback and read-aloud synchronization.

These tests establish software routing and lifecycle behavior, not speech recognition or vehicle-sound accuracy. The remaining minimal real check is a short Arabic greeting and a short spoken vehicle description through configured ASR, then a separate permission-cleared attached clip with its expected audible contents. Include an example of the reported wrong response if available. No recording is automatically ingested into a dataset. Training and classifier implementation remain out of scope, and the requested unvalidated 70% threshold remains disabled.

Final result: syntax checks passed; **160 Node tests passed, 0 failed, 0 skipped**. All four browser suites (`smoke_dictation`, `smoke_ui`, `smoke_examples`, `smoke_speech_sync`) passed with mocked provider responses. The dictation suite also verified English draft appending and lossless draft-overflow handling. No new Axe accessibility audit was run. A restarted local server returned health/media status successfully and correctly reported ASR unconfigured.
