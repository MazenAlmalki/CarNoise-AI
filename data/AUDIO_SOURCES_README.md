# Warshatak — curated automotive audio and source commentary (v1)

This research starter separates **recorded audio**, **research dataset leads**, and **publisher explanations**. No fault diagnoses have been confirmed by Warshatak.

## Files
- `data/audio_sources_v1.json`: 12 individually verified **source pages** for recordings (10 Freesound CC0; 2 Wikimedia Commons public domain). Each includes author, license shown at source, recording category and a disclaimer. **Audio bytes are not included**; Freesound downloads may require login. Review source metadata before use.
- `data/audio_dataset_catalog_v1.json`: four broader collections, with access/reuse restrictions and cautions.
- `data/source_comments_v1.json`: 12 **paraphrased editorial notes** from AAA, The AA and the US FTC with source links. These are *publisher guidance*, **not** mechanic-confirmed fault records, and are **not** user comments from the sound clips.

## Important validation
- A sound effect recording labeled “brake squeal” is not evidence of brake-pad failure.
- Freesound audio is suitable for developing similarity matching and testing robust embeddings, but creator descriptions are not professional repair findings.
- OtoMobile is particularly relevant because its researchers selected clips with mechanic-provided or mechanic-consulted diagnoses; the dataset is **restricted**. Request permission before use.
- KweriMoto documents that some labels are unverified or synthetic. Audit the entire chain of rights and labels.
- Procedural Engine Sounds is CC BY-NC and has engine-operating-condition data, **not fault labels**.
- University of Niš vehicle recordings are an operating sound baseline; license on the inspected page was unclear.
- Commons entries are public domain on their respective source pages. Keep source URLs and credit anyway.

## Suggested development path
1. Download CC0/public-domain audio manually from the linked source pages, respecting each site's download conditions.
2. Maintain a local manifest `clip_id,original_filename,author,license,source_url,sha256,duration_seconds,sound_category,diagnosis_verified`.
3. Normalize copies to a consistent sample rate for embeddings; keep untouched originals and their provenance.
4. For each query recording, retrieve closest audio examples via CLAP, plus text guidance using separate text RAG.
5. Apply a calibrated threshold and allow **unknown/ambiguous** answers.
6. Never report similarity score as probability of a mechanical fault. Ask about braking, handling, warning lights, and other important context.
7. Involve a trained mechanic before turning sound-source metadata into definitive mechanical labels.

## Sources
- Source pages linked in each record.
- AAA: https://www.acg.aaa.com/connect/blogs/4c/auto/car-noises-you-shouldnt-ignore
- The AA: https://www.theaa.com/car-care/advice/servicing/guide-to-unusual-car-noises
- FTC: https://consumer.ftc.gov/articles/0211-auto-repair-basics
- OtoMobile: https://zenodo.org/records/3382945

All curated summaries are paraphrases, not quotations.
