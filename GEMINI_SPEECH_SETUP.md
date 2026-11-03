# Natural Arabic voice and the mechanic

The user explicitly authorized sending **only the reply text selected for read-aloud** to Google for speech generation. `/api/speech` forwards that text and delivery/voice instructions to `generativelanguage.googleapis.com`; it does not forward recordings, images, chat history, car records or API keys to the browser. Generation uses Google quota/billing. Read-aloud remains opt-in: automatic reading stays off by default, and mute/preferences are preserved.

## Local setup

Keep the existing private `GEMINI_API_KEY` in the server `.env`. These optional settings select a speech-output model and prebuilt voice, independently of `GEMINI_AUDIO_MODEL` used to analyze recordings:

```dotenv
GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
GEMINI_TTS_VOICE=Charon
```

The default model and generateContent audio contract follow Google's [official generateContent TTS cookbook](https://github.com/google-gemini/cookbook/blob/archive/generate-content-api/quickstarts/Get_started_TTS.ipynb). [The current cookbook](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_TTS.ipynb) also documents the prebuilt voices and newer APIs. Model access, availability, price and quota must be checked for the user's project; neither a model name nor `configured:true` proves access. The speech model can be changed through `GEMINI_TTS_MODEL` without changing recording-analysis settings.

Restart with `npm.cmd run dev`, refresh the browser, then open **Mechanic voice / صوت الميكانيكي**. Automatic source chooses Gemini when a server key is configured; choose **Natural voice — Gemini / صوت طبيعي — Gemini** explicitly if desired. Select Charon, Enceladus, Fenrir, Puck or Kore and press Test voice. Enable automatic replies only if wanted. Generated Arabic works without an Arabic Windows voice or the browser SpeechSynthesis API. Device voices remain a separate selectable option, preserving matching-language safeguards.

`GET /api/speech/status` returns safe readiness metadata only. Missing/denied keys, unavailable models, quotas and generation failures display actionable messages. There is no silent switch to an English voice or another hosted provider on failure. The endpoint allows 10 generation requests per 15 minutes per IP in addition to the app's existing API limit. Replaying the last identical reply/voice/language reuses a memory-only audio blob, not another API request. Changing voice/text replaces that cache. Nothing is stored as an audio file on the server or in browser persistent storage.

## Character synchronization

`public/audio-speaker.js` decodes the returned WAV through actual HTML audio playback. A Web Audio analyser measures PCM amplitude on animation frames; smoothing opens the SVG mouth with audible energy and closes it during silence. The SVG now has a dark mouth/teeth/tongue shape instead of a static repeating white oval. A subtle body response uses the same amplitude value. Loading, playing, buffering, pause, resume, stop and end follow real audio events.

Pause/stop/mute, new messages, microphone recording, switching conversations and leaving the page cancel playback, close the mouth and release audio URLs/contexts. Cancelling generation aborts the local fetch and attempts to cancel the upstream request; already incurred provider usage cannot be undone. Reduced motion keeps the mouth/body static. If Web Audio is unavailable or remains suspended, normal media output is retained and a notice explains that amplitude synchronization is unavailable. The app never routes sound into a suspended graph and falsely treats a moving timer as proof of audible output. Lip movement follows loudness, **not phoneme-accurate lip sync**.

The cinematic intro remains entirely silent. This feature applies only to reply read-aloud and the explicit Test voice action.

## Validation

- Real local server tests cover safe status/error contracts. Mocked Google responses test Saudi Arabic delivery instructions, selected voices, no translation, PCM-to-WAV conversion, existing WAV handling, response size bounds, unsupported formats, key/model/quota errors and abort propagation.
- Chromium playback tests use an actual WAV with alternating tone/silence and **no browser speech API**. They verify RMS-driven mouth opening/closing, visible external SVG shape differences, actual pause/resume/stop/end cleanup, replay caching, voice selection and errors. Tone fixtures prove playback/synchronization, not Arabic pronunciation quality.
- The cloud environment has no Gemini key and does not currently permit the Google destination, so no live Google generation, project access, quota or voice quality was verified here. Local Windows setup uses the private server key and its normal network connection. Never paste the key into chat or frontend code.

Final verification: all 132 Node tests passed, including a real HTTP speech route backed by a controlled Google-response fixture. The existing Arabic/English garage/media/browser tests and silent-intro checks also passed. No actual Google inference was claimed by those tests.
