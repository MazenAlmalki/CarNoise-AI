# Warshatak V2 implementation review — 2026-11-03

## Working changes

- A compact native vehicle dropdown replaces the always-visible list. It retains all IDs and existing cars, years, history and IndexedDB attachment references. Only the selected vehicle's conversations are searched/shown. Titles use the first useful user complaint or transcript rather than repeated greetings; optional renames are additive. Each thread has one keyboard-accessible overflow control. Deletion still requires confirmation. Mobile remains a focus-managed drawer. Theme palettes switch together to avoid low text contrast during a dark/light cross-fade; unused vehicle-row/delete-button CSS selectors were removed after checking references.
- A collapsible, copyable problem summary separates user reports and automatic transcripts, assistant possibilities, successful model sound observations, uncertainties, absent confirmed findings and a safe next step. It does not extract a confirmed diagnosis from narrative text or uploader labels. Technical provider failure is distinct from an unfamiliar sound. Clipboard-denied browsers receive selectable text. Greetings/general questions do not generate new summary cards.
- Clarifications can be skipped to request a summary with no further questions. Existing answer-first, maximum-one-per-reply/two-per-case rules, greetings and positive-vocal-imitation jokes remain.
- The recording meter measures actual microphone RMS, never routes microphone audio to speakers and releases its context/animation when stopped, cancelled or switched. An unavailable analyser does not disable recording. Reduced motion uses a static meter. Success is a brief **reply-ready** gesture, never a claim that a fault was identified or repaired.
- Existing generated WAV playback drives mouth movement from real amplitude, closes in silence and stops on pause/cancellation/navigation/recording. Browser-voice boundary animation remains a limited fallback; neither is phoneme-level lip sync. Arabic uses matching Arabic voices or natural server TTS, never an English substitute. The intro remains **silent**, as requested.

## Measured latency and optimization

Before editing, local waveform-only processing of the two uploaded MP4 audio tracks took `[96,82,90,88,81]` ms and `[78,90,77,76,75]` ms respectively (5 runs each, Node 24/FFmpeg in the cloud workspace). This measures local processing only; no provider, transcription or video vision was involved.

The audio path previously awaited waveform inspection before normalization/inference. Those independent operations now overlap. Video frames/vision also overlap audio analysis. Temporary files are removed only after both branches settle, and failures retain other usable evidence. Verified reference bytes/base64 are reused until the manifest/file metadata changes. All 15 actual references are still supplied, without an unvalidated ranking filter.

`analysis.timings` records successful **and failed** waveform, normalization, audio-provider, ASR fallback and video-vision stages. Chat replies optionally include chat header/body and language-correction timing. API responses expose a content-free `Server-Timing: application` duration (from API middleware through response preparation). Browser voice diagnostics expose generation/download, memory-cache hit and time from speak request to the first actual playback event. Automatic read-aloud also records the full turn-to-first-playback duration. Browser Performance entries are `warshatak:speech-first-playback` and `warshatak:turn-to-first-playback`. Playback events do not prove a physical speaker is audible.

```powershell
node.exe scripts/benchmark_audio.js
```

Five initial runs of the bundled-WAV benchmark were 288, 270, 267, 308, 297 ms (mean 286 ms), including a **simulated 200 ms provider**. This demonstrates overlapping local stages, not live Gemini performance, a measured before/after hosted improvement, or recognition accuracy. The script makes no network calls.

No live Gemini key is available in this environment and its hostname is not allowed by network policy. Live provider latency, Arabic voice quality and generalization to vehicle sounds remain unverified. Existing Gemini speech uses a bounded complete-audio response. Unsupported streaming APIs, extra synthesis requests and partial-response playback were not introduced without live compatibility/latency evidence. Full reply text, the one-item in-memory speech cache and stale-request cancellation remain intact.

## Honest UI progress

The media adapter uses real XMLHttpRequest upload-completion events: uploading → analyzing → reply loading. An upload event never claims analysis succeeded. A slow request displays a cancellable waiting message; the existing request deadline and retry preserve editable text. There are no invented progress percentages or successful detections.

## Validation and running

```powershell
Set-Location C:\Users\umaze\Documents\CarNoise-AI
npm.cmd install
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

After updating files, restart the server and hard-refresh the browser (`Ctrl+Shift+R`). Existing `.env` settings stay server-side. No Windows Arabic voice installation is needed for configured Gemini TTS; real Google access/quota is still required.

`scripts/smoke_ui.cjs` is an optional browser test using an already-installed Playwright and Chromium (no new app dependency). It uses mocked chat/media providers, a real local HTTP upload, synthetic microphone input, actual IndexedDB/storage and clipboard, vehicle/history search/rename/delete confirmation, question skipping, error/retry and responsive RTL/LTR checks. Set `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `SMOKE_URL` and optionally `AXE_MODULE`/`SMOKE_ARTIFACTS` for the installed tools. Provider mocks are not live inference tests. The separate existing workspace TTS browser checks use actual PCM WAV playback with tone/silence to verify mouth movement, pause/resume/stop, cache and cancellation.

Dataset provenance, independent-review requirements, blocked evaluation readiness and metric definitions: [data/car-audio/README.md](data/car-audio/README.md).

## Verified result

Final syntax checks and 140 Node tests passed (0 failed, 0 skipped), including real FFmpeg decoding and local mock HTTP routes. Browser smoke checks passed in Arabic/English at 320, 390, 768 and 1440 px. Axe WCAG A/AA checks reported zero violations for the Arabic desktop summary, light desktop, English mobile and Arabic mobile drawer. Separate browser checks passed for silent intro/replay, Arabic transcript/reply/read-aloud under English UI, actual tone/silence WAV amplitude mouth movement, pause/resume/stop, cancellation, cache, quota error and suspended-audio fallback. All hosted provider responses in these automated checks were mocked.
