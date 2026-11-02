# Warshatak frontend

The interface uses a midnight green / mint identity in dark mode and an off-white / forest green palette in light mode. A car inside a conversation bubble is the brand mark; the small wheeled companion makes the welcome screen approachable without appearing in every message.

## Implementation

- `public/index.html`: the existing dashboard, conversation, composer and vehicle dialog, plus a short splash and a shared destructive-action confirmation dialog. Existing API-facing element IDs remain intact.
- `public/styles.css`: theme tokens, responsive layouts, component styles and motion. The main breakpoint is 680px for the off-canvas vehicle panel. Intermediate layouts simplify the welcome screen without shrinking its copy.
- `public/app.js`: bilingual copy, existing chat/storage/media logic, SVG icon helper, accessible navigation, splash lifecycle and attachment drag/drop.
- `public/assets`: original SVG logo, companion and icon sprite. Locally bundled IBM Plex Sans Arabic and Inter fonts use `font-display: swap`; their OFL licenses are included. There are no font CDN requests or additional application dependencies.

The splash dismisses after 1.6 seconds and runs once per tab. Reduced-motion users skip it and all decorative animations. The mobile menu supports Escape, focus containment and restoration; closed content is removed from keyboard navigation with `inert`. Destructive dialogs focus Cancel by default. Themes, language, cars and conversations retain the existing local-storage format. Attachments still use IndexedDB and upload only when sent.

## Validation

Run `npm run check`, `npm test`, then `npm start` from the repository root.

Browser checks used Chromium and Playwright installed outside the application checkout:

- Arabic/RTL and English/LTR, dark and light themes; no horizontal overflow at 390, 768, 1024 or 1440px.
- Vehicle creation, cancellation/confirmation of deletion, saved conversation reload and reopening.
- Two-turn chat, loading state, retained draft and restored controls after a failed API call. Chat responses were mocked to test the frontend/API contract without provider credentials.
- Attachment preview/removal, generated microphone recording, no upload before Send, real local FFmpeg upload processing and deletion of saved media.
- Mobile menu, Escape, reduced motion and no browser JavaScript errors.
- Axe WCAG A/AA checks on both desktop themes and the populated mobile menu.

The repository baseline has 73 passing tests and one existing failing source-text assertion at `tests/carAudioCatalog.test.js:32`; it expects `audio-classifier-not-configured` in the unchanged backend. Live hosted chat/vision still requires a usable OpenRouter key. CLAP/Whisper inference and physical microphone hardware were not validated; browser recording used Chromium's fake audio device.
