# Warshatak — workshop edition

This edition replaces the robot in the interface with an original human mechanic, and evolves the existing dashboard into a warm, modern workshop. Forest greens and sand/amber accents connect the illustration, selected vehicle “garage bay”, service-card prompts and composer. Arabic remains the primary layout; English uses the same hierarchy in LTR.

## Files and structure

- `public/index.html`: mechanic stage, workshop prompts/tip, recording status, fixed composer layout and existing dialogs. API-facing element IDs are preserved.
- `public/styles.css`: retained shared components, accessibility styles and locally bundled fonts.
- `public/workshop.css`: workshop theme tokens, component refinements, responsive main scroll pane, recording and mechanic styles. Loaded after the shared stylesheet so edition-specific styling has one home.
- `public/app.js`: bilingual copy, state-driven illustration, elapsed recording clock, stable existing-message animations, friendly network errors and bounded dialog close motion. Existing routes, payloads and storage schemas are retained.
- `public/assets/mechanic.svg`: a compact SVG sprite with shared face/body/tool geometry and four original poses: `welcome`, `thinking`, `recording`, `error`.
- `public/assets/brand-mark.svg`: the existing car/conversation identity recolored for the workshop palette.

No application dependencies, backend files, provider settings or secret files were changed. Existing bundled font licenses remain under `public/assets/fonts`.

## Behavior

The mechanic uses the real UI state: an active microphone selects the listening pose; a pending request selects thinking; a displayed error selects the reassuring error pose; otherwise the welcome pose is used. None of these states asserts that media analysis or diagnosis succeeded.

Recording duration is measured from actual recorder start. Preview/removal and the existing upload-on-Send path are preserved. Sending is disabled during recording until the recording is available for preview. The character's gesture changes are limited to transitions between these states; decorative movement does not loop indefinitely. Thinking dots run only while a request is pending.

The app keeps the composer in a separate flex region; only the main conversation/welcome pane scrolls. Mobile prompts remain accessible by scrolling that pane. Existing message bubbles do not replay entrance animations after each response. Reopening a conversation can introduce its messages again. Dialogs retain native focus behavior; closing animates for 140 ms unless reduced motion is requested.

The short splash is shown once per tab and skipped for reduced-motion users. Mobile navigation retains Escape, focus containment/restoration and `inert` while closed. All new product copy is available in Arabic and English.

## Verification

Run `npm run check`, `npm test`, and `npm start` from the repository root. On Windows PowerShell, use `npm.cmd` instead of `npm`.

Chromium/Playwright checks (tools installed outside the application checkout) covered:

- Arabic/RTL and English/LTR, dark/light themes, viewport widths 390/768/1024/1440, and mobile main-pane scrolling with a reachable composer.
- Vehicle creation/switching, cancellation/confirmation of deletion, persisted history reopening, mobile navigation, Escape and reduced motion.
- All four mechanic states, recording elapsed time, recording preview/removal, no upload before Send, actual local FFmpeg waveform processing and saved-media deletion. Microphone input used Chromium's fake device.
- Multi-turn frontend/API contract, message animation stability, attachment conversation, preserved drafts and restored controls after failure. Hosted chat/vision responses were explicitly mocked; live provider inference is unverified without credentials.
- Axe WCAG A/AA checks for both desktop themes and the populated mobile menu.

Repository baseline: syntax checks pass; 73 of 74 tests pass. The existing failure at `tests/carAudioCatalog.test.js:32` expects a source string absent from the unchanged backend. It was not weakened or hidden.

## Review and publication

Work is on local branch `codex/mechanic-workshop-ui`, based on the existing redesign. Per request, it has not been pushed or merged. The accompanying review ZIP contains only frontend files and this document; it does not include `.env`, credentials, backend files or browser-test fixture data.
