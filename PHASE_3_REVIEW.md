# Warshatak Phase 3 review

This continuation starts from `e98f713` on `codex/gemini-audio-provider`. The attached workspace contained a clean older checkout and none of the reported pending local files, so the pending upgrade was reconstructed from the confirmed feature commit. No reset, clean, dataset ingestion, classifier implementation or training was performed.

## Behavior

- `server/unifiedCase.js` builds a bounded evidence record for each chat request: original written description, user-authored conversation statements, automatic transcript, successful audio/visual observations, waveform availability, selected/corrected vehicle and earlier unverified cases. No binary media is duplicated in the record. Assistant guesses are excluded from user statements; earlier assistant summaries remain marked unverified.
- ASR is used as the main utterance only for a complete media-only request. For example, `Analyze the recording. My brakes squeal when braking after a long drive.` stays the final user message even if ASR says something else. Detailed Arabic descriptions behave the same way. Generic attachment requests can still follow the recognized speech language.
- A limited rule checks opposite positive/negative statements about squealing, braking, steering, idling and acceleration between written text and ASR/model audio observations. Possible discrepancies reach the model and the copyable summary as unverified conflicts. This is a conservative lexical hint, not semantic contradiction detection: it can miss paraphrases or flag statements about different circumstances. Neither source becomes verified truth; any clarification stays within the existing question budget.
- `data/saudi_usage_terms_v2.json` and `server/saudiUsageTerms.js` add 16 manually curated language mappings. Terms such as قير, سلف, فحمات, هوبات and طرمبة support interpretation/retrieval; they are not recordings, fault labels or evidence of a defective component. Ambiguous terms retain context requirements.
- `public/media-formats.js` shares the supported container/MIME allowlist and 25 MiB maximum across browser, upload middleware and processing. Empty, unsupported and oversized files are rejected. Recorder MIME codec parameters are normalized; MIME declarations do not verify file contents, and supported files still need successful decoding. No extension-only fallback pretends to verify bytes.
- Upload percentages use only measurable XMLHttpRequest byte events. Upload completion switches to analysis; it never claims analysis is complete. Unknown totals remain indeterminate, with cancellation/retry retained.
- Structured vehicle years now travel with chat requests. Bounded user-only vehicle correction memory survives the recent-turn window; later model/year corrections override older labels, and switching models without specifying a year clears the old model's year. Negated former models/years are not adopted as corrections. Other vehicles merely mentioned nearby do not replace the selected one. This is case context; it does not silently rename garage entries or establish engine variants/recalls.
- Transcript correction controls preserve an unsent draft. Long descriptions, summary controls and media remain contained on narrow RTL/LTR layouts. Stored IDs, original descriptions, history and IndexedDB media remain intact.

## Verification

Run from the repository root with Node 24 and FFmpeg available:

```sh
npm run check
npm test
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright SMOKE_URL=http://127.0.0.1:3006 node scripts/smoke_ui.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright SMOKE_URL=http://127.0.0.1:3006 node scripts/smoke_examples.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright SMOKE_URL=http://127.0.0.1:3006 node scripts/smoke_speech_sync.cjs
```

Start the local smoke server separately with `PORT=3006 NODE_USE_ENV_PROXY=1 npm start`. Playwright/Chromium are environment tools, not new application dependencies. Adjust `PLAYWRIGHT_MODULE`/`CHROMIUM_PATH` on other machines. Local listener/browser checks require an execution context permitting loopback connections. All hosted responses in these checks are mocks; no live provider accuracy, latency or credentials are claimed.

The HTTP regression verifies original text forwarding, separate transcript/video/history evidence, conflict metadata and corrected vehicle identity at the provider boundary, plus rejection of unsupported/empty uploads. Unit regressions exercise old-year negation, long-conversation vehicle memory, shared MIME boundaries and measured upload progress/cancellation. The browser smoke uses a real local upload, microphone/storage/DOM and mock inference to check detailed text preservation, structured year forwarding and transcript-edit draft preservation, plus existing Arabic/English responsive checks at 320, 390, 768 and 1440 px.

## Stop boundary

Phase 3 is the stop point. `data/car-audio/integration-plan.json` records the boundary. Wait for new permission-cleared recordings before any ingestion, classifier implementation or training. Existing component titles remain **unverified uploader hypotheses**. The requested 70% threshold is **disabled and unvalidated**; the plan value is metadata only and is not wired into runtime decisions. The existing evaluation is blocked pending independent acoustic reviews and test recordings. No additional audio was ingested and no labels were promoted to ground truth.

Final verification: `npm run check` passed; **156 Node tests passed, 0 failed, 0 skipped**. All three Chromium suites above passed with mocked provider responses. Screenshots were captured and the Arabic mobile drawer was visually inspected. Axe was not enabled in this run, so no new automated accessibility-audit result is claimed. Live hosted inference remains unverified because provider credentials are not available in this environment.
