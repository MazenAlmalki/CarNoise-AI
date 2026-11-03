# Cinematic welcome / مقدمة ورشتك

The first-visit welcome runs for **10.8 seconds after Tap to begin**, followed by the existing app. It uses a native modal dialog, a dark green gradient, the existing brand mark, subtle light/dust motion, word-staggered tagline, readable bottom subtitles, a quiet locally synthesized ambient chord, and browser speech. No sound starts before the begin gesture. Mute affects music and narration. Skip, Escape and Space exit immediately, stop audio and restore focus. The once-only flag is `warshatak-cinematic-v1` in localStorage; Your experience / تجربتك in the sidebar offers Replay intro and a language switch. The header, settings and intro share the existing saved garage language. No garage IDs, messages or media are migrated.

## Scripts

Arabic: **ورشتك. لكل صوت حكاية. نفهم الإشارات، ونوضح لك الخطوة الجاية.**

English: **Warshatak. Every sound tells a story. Understand the signs, and find your next step.**

Taglines: **معك، في كل مشوار.** / **With you. Every mile.**

Native speech prefers a matching ar-SA/en-US voice, honors a matching saved voice preference, and uses rate 0.9/pitch 0.86. Voices can arrive asynchronously. If the requested language is unavailable or speech fails, subtitles and the timed visuals continue; Arabic never substitutes an English voice. Native voice timbre, accent and boundary events vary by browser/device. The script is custom; a unique studio voice and exact phoneme synchronization are not claimed.

Speech boundary events drive the caption/visual cue when available, with an elapsed-time fallback when the engine does not supply timing. Music ducks from gain 0.018 to 0.005 while narration plays and returns afterward. No hosted TTS endpoint was added; the pending Google reply-text export feature remains outside this change.

## Files to edit

- `public/intro-copy.js`: scripts, tagline and 10.8-second duration. Keep scripts short so they fit the bounded intro.
- `public/cinematic-intro.js`: scenes, replay, focus, storage and shared language. `recordedSources.ar/en` can point to owned local WAV/MP3 narration files; no API integration is required. Aim for a 9–10-second recording and align its three caption cues to 0/2.6/6 seconds, or update the adapter cue mapping.
- `public/intro-audio.js`: pluggable native/file narration, synthesized music and ducking. Recorded files use actual playback time for caption cues.
- `public/intro.css`: palette variables, typography and animations. Tajawal Arabic 400/700 are bundled under OFL in `public/assets/fonts/TAJAWAL-LICENSE.txt`.

The existing 1.8-second session splash and its obsolete CSS were removed. The new request's first-visit 8–12-second intro replaces that earlier behavior. Reduced motion removes light/dust/glow/word motion and uses a simple fade into the app. Only transforms/opacity animate continuously; the initial wordmark blur is brief. Performance depends on the user's hardware; no universal 60 fps guarantee is made.

## Verify

Run `npm.cmd run check` and `npm.cmd test`. Open with fresh localStorage for the first visit, or use Replay intro. Confirm no sound before Begin; select Arabic/English, begin, mute/unmute, skip with the button/Escape/Space, reload, and replay. Check installed voices, missing Arabic voice, reduced motion, phone and desktop, and that recording/chat still work. Clearing **only** `warshatak-cinematic-v1` resets the introduction without deleting garage data.

Node tests cover bounded timing, translations/cue mapping, asynchronous matching Arabic voices, no English substitution, music ducking, mute/unmute, cleanup and the recorded-file adapter. Chromium smoke tests exercised the real-duration intro, before-gesture silence, boundary-driven captions, persistence/replay, shared language, focus and keyboard controls, missing Arabic fallback, a local WAV adapter and audio cleanup. Speech events used controlled fixtures; native audible voice quality on the user's device is not verified. Automated axe scans found no violations in tested desktop/mobile intro states. The existing app smoke test covered vehicle history, chat/media, recording, speech controls, retries and mobile navigation.
