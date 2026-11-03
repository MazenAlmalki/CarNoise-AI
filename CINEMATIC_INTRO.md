# Single-screen silent welcome

The first visit shows one branded screen with the logo, name and tagline together. It starts automatically, holds briefly, then fades directly into the app and focuses the chat composer. Total duration is 2.4 seconds including a 550ms fade. There is no separate start page, scene sequence, changing captions, music or narration.

Start chatting skips the wait and fades out. Escape/Space close immediately. Replay remains in settings; replay restores focus to the triggering control. The existing `warshatak-cinematic-v1` first-visit key and garage language preference are retained. Changing language does not restart the timer. Reduced motion uses static content and a shorter 800ms total with a simple fade. The modal keeps the app inert until it closes. A transparent backdrop allows the chat to appear during the fade.

Edit copy/duration in `public/intro-copy.js`, behavior in `public/cinematic-intro.js`, and styling in `public/intro.css`. Microphone recording and mechanic reply speech are separate and unchanged. No .env changes are required.
