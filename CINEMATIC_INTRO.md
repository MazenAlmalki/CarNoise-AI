# Silent cinematic welcome / مقدمة ورشتك بدون صوت

The first-visit welcome runs for **10.8 seconds after Tap to begin**. It keeps the dark green gradient, brand reveal, light/dust effects, word-staggered tagline, bottom text and dissolve into the app. **The intro has no narration, music, audio files, Web Speech calls or AudioContext initialization**, including on replay. The former `public/intro-audio.js` adapter and its obsolete audio-only tests were removed with the feature.

Skip, Escape and Space exit immediately and restore focus. The first-visit flag is `warshatak-cinematic-v1` in localStorage. Your experience / تجربتك offers Replay intro and a language switch. The header, settings and intro share the existing saved garage language; car IDs, messages and media are preserved. Reduced motion uses static text and a simple fade.

## Visible text

Arabic: **ورشتك. لكل صوت حكاية. نفهم الإشارات، ونوضح لك الخطوة الجاية.**

English: **Warshatak. Every sound tells a story. Understand the signs, and find your next step.**

Taglines: **معك، في كل مشوار.** / **With you. Every mile.**

## Editing

- `public/intro-copy.js`: text, tagline, duration and elapsed-time caption cues.
- `public/cinematic-intro.js`: scenes, replay, focus, storage and shared language.
- `public/intro.css`: palette, Tajawal typography and motion. The bundled font license is `public/assets/fonts/TAJAWAL-LICENSE.txt`.

This change only removes sound from the intro. Mechanic read-aloud, microphone recording and recording playback remain separate app features. Arabic read-aloud still requires an Arabic voice available to the browser. No hosted TTS service is enabled.

## Validation

Run `npm.cmd run check` and `npm.cmd test`. Test a fresh visit or Replay intro, and confirm the same visuals/timing with no audio. Check Arabic/English, Escape/Space, skip, reduced motion and mobile. Reset **only** `warshatak-cinematic-v1` to see the first-visit screen again without deleting garage data.

Browser validation instruments AudioContext, Audio and speech synthesis to verify that neither the initial intro nor replay initializes sound. Caption timing, persistence and the dissolve remain tested. Microphone-to-chat checks use actual browser recording with synthetic input and a mocked Arabic transcript/provider reply. They verify that recognized speech language survives an English interface, the conversation stores the returned reply language, and read-aloud selects an available Arabic voice. Actual speech recognition accuracy and installed-voice availability on the user's machine are not established by these fixtures.
