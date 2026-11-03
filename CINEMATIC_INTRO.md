# Single-screen silent welcome

One page shows the logo, name, tagline and a central **ابدأ المحادثة / Start chat** button. It waits indefinitely for explicit activation; there is no automatic transition timer. The button fades into the app in 550ms (150ms with reduced motion), then focuses the chat composer. Escape/Space exit immediately. No music, narration, changing scenes or start gate is used.

Replay and language switching remain in the compact Settings area. The `warshatak-cinematic-v1` first-visit key and saved garage language are preserved. The first-visit flag is written on dismissal, not merely on opening. Backgrounding the tab does not dismiss the screen. App controls remain inert until dismissal. Explicit replay is blocked while recording or waiting for a response. Existing conversations/data are never deleted or migrated.

Copy: `public/intro-copy.js`. Behavior: `public/cinematic-intro.js`. Styles: `public/intro.css`. No .env changes are required.

Validation: `npm.cmd run check`, `npm.cmd test`, and optional Playwright `scripts/smoke_examples.cjs` (see audio comparison review for tool environment variables).
