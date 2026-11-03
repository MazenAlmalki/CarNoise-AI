# Sound-reference results from the two supplied videos

Continues `d9cb927` on `codex/gemini-audio-provider`. The initial checkout was clean. The microphone remains dictation → editable draft → explicit Send. This change concerns attached audio/video and reference comparison, not training.

## Source inspection and reuse

Both uploaded originals were available in this task. They exactly match the previously inventoried source hashes:

| Original | SHA-256 | Duration | Existing clips reused |
| --- | --- | --- | --- |
| بعض أصوات الأعطال في السيارة.mp4 | `283042b2fa14e5c6b6ae1fc24c2f897ef13d4ee463e122915162714355017b66` | 28.235465 s | 8 |
| بعض اصوات اعطال السيارة 2.mp4 | `89bbd7fee4d6219148ae66373eaac61022fbefe35512335dfeb61149b515d72b` | 21.640998 s | 7 |

Decoded each source window with FFmpeg and compared its mono 16 kHz PCM byte-for-byte against the existing reference: **15 of 15 exact matches**. Reference file hashes also match. No audio clips were regenerated, duplicated, relabeled as verified faults or added to a training set. The uploaded originals remain in the task attachment workspace; they were not copied into the repository. A new clone contains the existing WAVs/metadata, not the original MP4s; use the originals supplied by the user when rerunning the source audit.

Frames at the beginning, midpoint and just before the end of each existing window were inspected. Midpoint/end title associations are visible; several beginnings are blank or in title transition. These are central windows, not verified full-event boundaries. Added `label_alignment_review` beside the preserved original labels/timestamps/hashes. Observed title wording can differ from the earlier normalized transcription: e.g. `البوالات` vs stored `البالات`, and `السيلف` vs stored `السلف`. Original fields were retained rather than overwritten.

The following IDs need terminology clarification before a problem name is shown: `upload1-01`, `upload1-03`, `upload1-04`, `upload2-06`, `upload2-07`. Their clips remain available for actual-audio comparison; a nominal match yields “No reliable match” rather than a guessed component. The other titles remain **unverified uploader hypotheses**, not mechanical ground truth.

This execution environment cannot consume audio for listening, and no Gemini audio key is present. Accordingly, no human/model acoustic review is claimed. Decoding, PCM equality and visual title inspection cannot establish what a sound means or prove that its displayed component is faulty. All acoustic-review fields remain pending. See `data/car-audio/source-review.json` and the reference manifest for per-window evidence and limitations.

Reproduce the byte-level source check without changing files:

```sh
python3 scripts/verify_reference_sources.py "path/to/بعض أصوات الأعطال في السيارة.mp4" "path/to/بعض اصوات اعطال السيارة 2.mp4"
```

The script checks the exact source hashes, all existing WAV hashes and decoded PCM equality. It refuses different source videos; it does not bypass integrity checks or perform recognition.

## Compact result behavior

The existing Gemini native-audio comparison still sends the target and all 15 hash-verified reference WAVs, with reference component titles withheld from inference. No filename/transcript/waveform lookup was introduced as a sound recognizer, no model was downloaded and no weights were trained.

After inference, `server/soundResult.js` produces one bounded card for a new attachment requested with `resultFormat:"compact"` and `mediaAttachedThisTurn:true`. The browser sends those fields only for an actual attachment-analysis attempt; an ordinary text follow-up stays in chat. A compact result requires no additional text-model inference. Existing clients that do not request compact results retain the conversation route.

A possible named match requires all of the following:

- Successful native-audio evidence of a clear mechanical event, including for `mixed` content. Ordinary speech, music, silence, waveform-only output and failed inference cannot establish that event.
- A direct reference comparison with `result:"clear"`, exactly one candidate and a nonempty audible-comparison reason. “Clear” is a categorical model observation, **not a calibrated confidence percentage**.
- A known, hash-verified local reference, with no unresolved terminology flag. Returned client/model labels are ignored; names come from the trusted reference manifest, using the observed Arabic title where available.
- No recorded text/transcript conflict, explicit incompatible operating condition or user feedback that the example is different/uncertain. These checks are conservative lexical exclusions and cannot detect every semantic contradiction.

Partial/multiple/unknown/ambiguous/unmatched/failed cases return **No reliable match**, one short reason and one useful next step. There is no forced fallback to the nearest fault name. Spoken complaints remain user reports rather than observed vehicle sounds. Speech-only generic attachment requests can still follow the recognized words through ordinary chat rather than fabricate a fault card.

For a possible match, the card contains:

1. **Possible problem — tentative match:** the unverified title.
2. **Why it may match:** one short model-reported resemblance sentence, explicitly tentative; unsafe/debug/percentage-style reasons fall back to a neutral explanation.
3. **What to do:** two practical steps, including an appropriate professional inspection.
4. **Safety:** one warning only when danger was reported.
5. A small expandable reference player and guidance source link.

Model/provider names, raw JSON and technical scores are not rendered in the card. It uses text nodes, validates reference URLs and excludes non-HTTPS source links. Plain text remains available for read-aloud/history. A second problem-summary/reference-question card is suppressed; the original attachment is collapsed beneath the result. New results scroll to their heading. Arabic/English layouts retain responsive containment.

Vehicle identity does not establish engine variant, source compatibility or a model-specific defect: the reference recordings have unknown vehicle/year/operating conditions. Relevant current descriptions and user-authored conversation remain separate from past assistant possibilities. Recent chat cases are now included in bounded vehicle history as unverified summaries, alongside older analyses. Prior descriptions are used for explicit “same sound/problem” continuations, not silently treated as current observations.

## Guidance provenance

Next steps reuse the existing cited symptom guidance in `data/typed_symptoms_v1.json`, with the following related-system mapping. These are general inspection recommendations, not component repairs or quotations independently revalidated online in this task.

| References | Related guidance |
| --- | --- |
| upload1-01, upload2-06 | T016 belt-system inspection |
| upload1-02 | T001 persistent brake squeal inspection — The AA noise guide |
| upload1-03, upload1-07, upload2-01, upload2-02 | T027 suspension/attachment inspection — The AA noise guide |
| upload1-04 | T014 persistent engine ticking inspection — The AA noise guide |
| upload1-05, upload2-03 | T013 cooling-system guidance — AAA; next step is a technician's cooling inspection, not an unconditional overheating claim |
| upload1-06 | T019 starting-system inspection — AAA |
| upload1-08 | T023 battery/charging assessment — AAA |
| upload2-04 | T022 electrical/charging inspection — AAA |
| upload2-05 | T008 persistent idle-vibration inspection — FTC repair guidance |
| upload2-07 | T029 steering inspection — The AA noise guide |
| No reliable match | T040 describe circumstances and obtain an appropriate assessment — The AA noise guide |

Ambiguous IDs are listed for provenance but cannot currently produce a named result. No replacement, cost, confirmed repair or percentage is invented from a resemblance. A technician must establish the cause before replacing a component.

## Verification and limitations

Run from the checkout:

```sh
npm run check
npm test
npm run evaluate:audio
# Separately start the app:
PORT=3008 NODE_USE_ENV_PROXY=1 npm start
# In another terminal, using environment-installed Playwright/Chromium:
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright SMOKE_URL=http://127.0.0.1:3008 node scripts/smoke_sound_results.cjs
```

`evaluate:audio` deliberately exits **2 / blocked**: 15 references, **0 independent held-out recordings**, acoustic categories still awaiting independent review and metrics **null**. Excerpts from these two source groups cannot be reused as independent test examples. Same-clip replay/reference equality is a software/integrity check, not recognition accuracy.

The card browser suite uses **mocked audio inference** with actual compact-card HTTP construction, actual saved media/history and actual reference WAV playback. It covers matched/mixed, speech, music, silence, other, uncertain, partial, ambiguous and unknown reference results, provider failure, both languages, safe rendering and 320/390/768/1440 px. Existing dictation/UI browser checks verify that microphone and attachment flows remain separate. The uploaded-source audit checks actual video decoding and frames; it does not evaluate an audio model.

No Gemini/chat/Groq keys or private `.env` are available here. The running cloud policy also lacks `generativelanguage.googleapis.com`. Live comparison needs a securely configured `GEMINI_API_KEY`, `AUDIO_PROVIDER=gemini`, an account-supported native-audio `GEMINI_AUDIO_MODEL`, reference audio enabled and allowed provider access. See existing setup documentation; never enter keys in chat. No live comparison, fault accuracy or latency is claimed.

For the first real check, use a new independent vehicle recording with operating conditions and what an inspection actually established, plus independent speech and unrelated/noisy audio. Acoustic reference annotations should be reviewed without showing component titles. A larger reviewed, source-group-separated test set is needed before recognition metrics or a threshold can be validated. The requested 70% threshold stays disabled; training is not justified by these two compilations alone.

Final verified result: `npm run check` passed; **166 Node tests passed, 0 failed, 0 skipped**. The final compact-card Chromium suite passed after the execution limit cleared. The existing garage/media UI suite and separate dictation suite also passed during this change. Provider/audio inference was mocked in browser checks; reference playback and compact-result HTTP construction were real. Source verification matched all 15 WAVs against the two originals. Independent recognition evaluation remains blocked (exit 2), with zero test recordings and null metrics. No new Axe accessibility audit was run.
