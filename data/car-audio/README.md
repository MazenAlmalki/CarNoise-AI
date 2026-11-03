# Audio evidence and evaluation

The 15 existing WAVs remain in `../uploaded_audio_references/`. No source media is duplicated or trained on. `sources.json` inventories the two uploaded videos; the latest uploads have the same SHA-256 values as the originals, so they are not independent test recordings.

Each record in the existing manifest now separates:

- `reported_problem`: the original bilingual **suspected fault**, with its title-card provenance. All remain unverified; `fault_verified=false`.
- `acoustics`: independently reviewed category, speech/music presence and observations. These remain **null/pending**, because decoding/level measurements do not identify what is heard. Hosted model observations, when obtained, are also unverified and must not fill this ground-truth field automatically.
- Signal measurements, exact clip window, WAV/source hashes, source group, reference-only split, unknown recording conditions and permission scope. Submitting a file for analysis does not establish a general redistribution license.

Gemini compares actual target and reference audio with component titles withheld. Its optional `acousticCategories` uses a sound vocabulary (squeal, whistle, click, clunk, grind, hum, rattle, rumble, speech, music, silence, other), distinct from component names. Existing `sounds` free text and response contracts are preserved. Category observations and reference resemblance are not confirmed faults. No confidence percentages are returned.

## Why direct audio comparison remains

The existing hosted audio path already accepts actual audio. It remains the active comparison method, with all 15 references; no unvalidated prefilter discards references. Verified reference bytes/base64 are cached and invalidated when the manifest or file metadata changes. No new model download, provider change, dependency or credential is introduced.

CLAP remains an optional local sound/text similarity path, not a trained fault classifier. Learned audio embeddings would need an installed/licensed model, measured latency and independent reviewed recordings to validate retrieval and rejection. None is established in this environment. Handcrafted waveform metrics cannot substitute for those embeddings. Denoising/loudness normalization was not added: it could erase a quiet fault or distort comparison without a reviewed evaluation set. Existing mono 16 kHz PCM normalization and bounded excerpts remain.

## Reproducible evaluation

```powershell
node.exe scripts/evaluate_audio.js
```

Current result: **blocked**, 15 reference recordings, 0 independent test recordings, metrics `null` (exit code 2). This is an honest readiness result, not a failing recognition benchmark. There are no validated recognition percentages or mechanic-confirmed diagnoses.

Before evaluating:

1. Have a reviewer listen to reference audio without the component titles, label its acoustic category from `server/acousticCategories.js`, then record `acoustics.review_status="independently_reviewed"` and `acoustics.reviewed_category`. Retain the original suspected component label separately. Record review details/provenance alongside any future review.
2. Obtain permission-cleared, independent recordings with reviewed acoustic categories. All excerpts or augmentations from one source recording belong to the same source group. Never split one compilation across reference/test sets. Include speech, music, silence, noisy recordings and sounds absent from the catalog.
3. Fill `evaluation.json.testCases`. An item has `id`, `file` (the evaluated clip path), `sourceFile` (the full original recording path), `audioSha256` (actual file hash), `sourceGroup` (full source hash), `reviewStatus:"independently_reviewed"`, `category`, `contentType` (`mechanical/speech/music/silence/other`) and `expectedUnknown` (boolean). Retain the file reference and permission/review provenance with it. Only `groundTruthType:"acoustic_category"` is accepted.
4. Capture independent model predictions in an array: `{ "id":"...", "rankedCategories":["squeal","whistle"], "rejected":false, "confident":false, "contentType":"mechanical", "processingMs":1200 }`. Record model/version/configuration and date next to the predictions. Set the acceptance/`confident` policy **before** evaluation and document it; a categorical clear-reference result is not a calibrated probability. Do not assign confidence after seeing ground truth. The evaluator does not call a provider or translate component labels into categories.
5. Run `node.exe scripts/evaluate_audio.js data/car-audio/evaluation.json path/to/predictions.json`.

The CLI hashes the actual clip and source files (paths relative to the evaluation config) and checks them against the declarations. The evaluator rejects missing reviews/predictions, component names as categories, duplicate audio and any reference/test **source** overlap. It reports top-1/top-3 for known acoustic categories, incorrect confident decisions, unknown rejection with denominator, content-type and speech-versus-car accuracy, and average supplied processing time. A metric without eligible examples remains null. A confusion matrix requires at least 10 reviewed examples and two categories. Report recording conditions and sample sizes; this never measures faulty-part accuracy. Unit-test metadata fixtures validate the evaluator only.

## Interactive reference comparison and collection

The runtime can now offer one actual WAV chosen by a successful Gemini audio comparison. Close/Different/Not sure/Skip feedback stays in the case on the user's device; it is not uploaded to a training store and never becomes independently reviewed ground truth. Previously offered IDs are sent back to prevent repeats. A Close selection means perceived resemblance only, never a verified component. The original uploader hypotheses remain unverified. Existing project-supplied clips are served from a fixed, hash-verified allowlist; this does not establish a general redistribution license. Confirm rights for any broader deployment.

No external audio was collected in this change: no additional suitable reuse permission or independently reviewed recording set has been established. Before importing data, record the license/consent, source URL/hash, complete source group, file and segment boundaries, operating conditions and anonymization requirements. Have reviewers listen without component titles, record acoustic-category review provenance and disagreements, and retain ambiguous recordings as unknown rather than forced labels. Include independent speech, silence, music, noisy and out-of-catalog recordings. Keep every segment/augmentation from one source in one split; never turn user resemblance feedback into a component label.

Training/fine-tuning and an embedding replacement are not justified by the current two compilations and pending acoustic reviews. No new model weights, model download or provider switch were introduced. The actual-audio comparison remains available, and the existing file-hash/source-group evaluator blocks unsupported accuracy claims. Run `npm.cmd run evaluate:audio`; exit code 2 currently reports missing independent reviews/test recordings, not a measured recognition failure.
