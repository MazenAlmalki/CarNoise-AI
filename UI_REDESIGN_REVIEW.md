# UI redesign review

The garage now uses compact vehicle rows, a selected indicator and an inline overflow menu for rename/delete. Rename preserves the vehicle ID and saved cases. History is filtered to the selected vehicle. Destructive deletion retains the existing confirmation dialog and media cleanup. Empty-history messaging, long names and a scrollable garage remain supported. The mobile drawer retains keyboard focus trapping, Escape dismissal and inert background behavior.

The human mechanic has idle/listening/thinking/speaking poses, restrained blinking and a speaking mouth animation. Browser text-to-speech is opt-in: read individual replies, enable automatic new replies, select an available Arabic/English voice, mute, pause/resume or stop. Preferences are stored separately from garage data. Playback stops on microphone recording, navigation, new messages and language changes. Missing voices and unavailable speech APIs have text fallbacks. Animation follows speech events; this is not phoneme lip sync. Voice quality/availability depends on the browser and installed voices.

The intro is skippable by button, Escape or Enter, appears once per tab, ends within two seconds, and is skipped for saved garages and reduced-motion users. Loading reflects actual requests, with a combined upload/analysis label because the existing upload endpoint performs both operations. Cancel and a two-minute deadline restore an editable message; retry reuses the draft and can retry failed attachment analysis. No progress percentages or successful provider results are invented.

Primary files: `public/app.js` (garage and request lifecycle), `public/voice.js` (isolated speech controller), `public/index.html`, `public/styles.css`, `public/workshop.css`, and `public/assets/mechanic.svg`. The backend, audio reference WAVs and diagnosis logic were not changed. Obsolete folder/count/intro-track rules and decorative sidebar/stage markup were removed after checking their use.

## Validation

- `npm run check`: passed, including the new speech module.
- `npm test`: all 120 passed. The obsolete source-string assertion in `tests/carAudioCatalog.test.js` was replaced with real HTTP checks that disabled recognition, unrecognized sound and provider failure never become fabricated diagnoses; no diagnostic safeguards were removed.
- Chromium smoke tests: Arabic/English, dark/light, 390/768/1024/1440 pixel widths without horizontal overflow; car add/rename/IDs, selected-car history and restored messages, many/long car names, cancel and confirmed deletion, microphone recording, upload on Send, media status, retry/cancellation, intro skip, reduced motion, and unavailable voice fallbacks.
- Speech play, pause/resume, stop and auto-read were exercised with browser speech fixtures; chat and media responses were mocked. Microphone and local storage used actual browser APIs. No live provider inference or audible installed-voice quality is claimed.
- axe scans: no WCAG A/AA violations reported for desktop dark, desktop light, and the mobile drawer in the tested states. This is an automated check, not an accessibility certification.
- A separate browser check confirmed audio clarification chips still render and submit a follow-up.

Before/after screenshots and browser scripts are retained in `/workspace/artifacts` and `/workspace/frontend-tools` in this workspace. The reviewed changes are intended for the existing `codex/gemini-audio-provider` branch. No deployment or merge into `main` is included.

## Run on Windows PowerShell

From the updated project folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Use the existing private `.env` for provider keys; do not copy keys into frontend code. The server defaults to port 3000.

## Follow-up review fixes

A successful retry now clears a prior attachment-analysis error. Attachment submission locks before asynchronous IndexedDB work, preventing rapid double-Send from creating duplicate cases/uploads/messages. Read-aloud is blocked while the microphone records. Navigation stops/discards an ongoing recording and invalidates a pending microphone-permission request. Voice preferences accept automatic playback only when explicitly stored as boolean true.

Additional Chromium regressions passed for media-failure then successful retry, microphone/TTS isolation, microphone-track cleanup on navigation, speech end/error, mute persistence, voiceschanged, a real aborted request with an accelerated deadline fixture, and rapid attachment double submission. Existing desktop/mobile interaction and accessibility checks were rerun after the review fixes. All provider/speech outcomes remain fixtures; cloud account access and real recognition accuracy remain unverified.

## Speech playback repair

A missing/empty browser voice list no longer blocks speech before the engine can choose its default with `ar-SA`/`en-US`. A previously paused engine is resumed before playback, long replies use bounded speech segments, and an eight-second start watchdog exposes stalled engines. A visible notice reports unavailable languages, browser permission errors, mute and recording conflicts; the speech panel includes a Test voice button. Actual audio output still requires an operational browser/device TTS engine; no new hosted TTS service or API key was introduced.

The mechanic's player is visible during playback on desktop and mobile, with immediate pause/resume/stop controls. The mouth responds to speech start and word-boundary events and closes during pauses, errors, stop and completion; the previous independent repeating mouth animation was removed. Engines without word-boundary events can only provide start/resume/end cues, not detailed word synchronization. Reduced motion keeps the mouth static. This is event synchronization, not phoneme-accurate lip sync or waveform analysis.

Browser fixtures verified empty voice lists, requested Arabic language/default voice, paused-engine recovery, speech chunking, visible mobile avatar, boundary pulses, closed mouth during pause/stop, ignored stale callbacks and visible language errors. Existing recording/retry and UI regressions also passed. Native audible output on the user's Windows device has not been verified.

## Independent sound troubleshooting

`/sound-check.html` provides a bundled one-second generated 440 Hz WAV, the same mechanic speech controller, and a local microphone recording with a live RMS meter, playback, download and optional device selection. The report distinguishes browser playback state from the user's explicit heard/not-heard answer. It includes no API keys, device IDs or automatic network uploads. Voice settings are shared with the app, and the page explains this. OS/tab mute and physical audibility cannot be inferred from a moving playback timer.

Chromium checks used a synthetic microphone device to verify nonzero signal capture, recorded-file playback, no muted/zero-volume media elements, bilingual mobile layout, report/download and zero uploads; axe reported no violations in the tested diagnostic state. This does not establish audible sound on the user's Windows device. The report is intended to isolate that remaining issue.
