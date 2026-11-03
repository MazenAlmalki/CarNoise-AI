# Interactive sound examples — implementation review

A successful hosted raw-audio comparison can nominate one of the existing 15 hash-checked WAVs. Only clear/partial comparisons with supporting audible reasoning qualify. Waveform/text/filename/component-label matches cannot nominate examples. Intelligible speech, vocal imitation, urgent symptoms, failed analysis, none/unclear matches, exhausted question budgets and previously offered IDs suppress examples. Component titles are not displayed as confirmed causes. This is direct audio comparison, not new embedding training or fault-model fine-tuning.

The server reserves the single reply question for “Does yours sound close to this?” and strips additional model questions. The question is included in saved messages so existing case-wide question memory counts it. The frontend stores feedback with the assistant turn locally. All previously offered IDs are supplied to prevent repeated suggestions, including after reload. Close only indicates resemblance. Skip requests a summary without further questions. Successful sound descriptions can still be used when no useful reference exists.

`GET /api/audio-references/:id` serves fixed, hash-verified project reference bytes; it cannot serve arbitrary upload/file paths. Playback is user initiated, labelled Reference example, has no automatic download (`preload=none`) and makes no Gemini speech request. Your recording is separately labelled. Attached players pause when another starts, when the microphone starts, on navigation/new requests, or when mechanic speech starts. A playback failure leaves feedback/skip available. Text replies remain accessible.

Sidebar: the existing compact vehicle selector, Add car action, searchable per-car history and confirmed deletion remain. Secondary experience/voice controls now share a single collapsed Settings entry. The intro is a silent single page with a central Start chat button; it waits until activation and fades to the composer. No credentials, provider settings, vehicle IDs or media references were changed.

## Checks

142 Node tests passed with real FFmpeg and mock provider HTTP responses. Browser `scripts/smoke_examples.cjs` verifies the intro remains open past the former deadline, button/focus/replay, actual reference WAV HTTP playback, recording interruption, feedback/rejected-ID persistence, mobile layout, reduced motion and optional axe. `scripts/smoke_ui.cjs` retains Arabic/English vehicle/history/search/rename/delete/retry/recording tests at 320–1440px. Browser providers are mocked; these are not recognition-quality tests. Live Gemini access/latency/Arabic TTS quality are not established here.

With already-installed Playwright/Chromium tools, set `PLAYWRIGHT_MODULE` to the module path, `CHROMIUM_PATH` to the browser, `SMOKE_URL` to the running app (defaults to port 3007), optionally `AXE_MODULE` and `SMOKE_SCREENSHOT`, then run `node scripts/smoke_examples.cjs`. No new production dependency was added.

## Data and training limit

All 15 uploader-suspected component labels remain unverified. Acoustic categories still need independent review, and there are zero independent held-out recordings. No additional permission-cleared sources were established or imported. No training, embeddings, calibrated fault confidence or recognition accuracy is claimed. The evaluator and source inventory remain available; see [data/car-audio/README.md](data/car-audio/README.md) for collection, split, review and reproducible evaluation requirements.

## Windows startup

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Open the configured local address and hard-refresh with Ctrl+Shift+R. Existing users can open Settings → Replay intro. No `.env` changes are required. Changes remain on the current feature branch and are not pushed.
