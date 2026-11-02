# ورشتك | Warshatak

Warshatak (ورشتك) is an Arabic/English vehicle-noise assistant with a responsive dashboard, light/dark themes, vehicle folders and history, and optional local audio/video attachments.

## Features
- Arabic / English user interface and Llama output (language setting preserved locally)
- Dark / light theme (saved locally)
- Multiple vehicles and a separate history for each
- Previous five analyzed issues for the selected vehicle are passed to Llama as **unconfirmed context** on the next analysis
- Four guided questions, possible causes, urgency, safety guidance
- Audio/video file uploads and microphone recordings, with local playback

**Multimodal V5:** Files remain saved locally in IndexedDB for history, and **when the user presses Send with a new attachment**, a copy is temporarily uploaded to this Node backend for processing. Images and sampled video frames use the configured vision model. Optional CLAP may analyze audio if specifically installed and enabled. The default chat model itself **cannot listen to sound**, and similarity results are not verified diagnoses. See [`MULTIMODAL_SETUP.md`](MULTIMODAL_SETUP.md).

## Free Llama on Windows

1. Install or update [Ollama](https://ollama.com/download).
2. Run:
   ```powershell
   ollama pull qwen3.5:2b
   ```
3. From the CarNoise-AI folder:
   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```
4. Open http://localhost:3000

The chat backend defaults to a modern compact `qwen3.5:2b` model (unless `.env` overrides it) at `http://127.0.0.1:11434/v1/chat/completions` and no API key. Ollama must be running locally.

For a cloud provider create your own `.env` using `.env.example` and set `LLAMA_API_URL`, `LLAMA_API_KEY`, and `LLAMA_MODEL`. Never commit secrets. A deployed backend cannot access Ollama on a user's own laptop through localhost.

## Data and privacy

Vehicle names, issues, and AI result summaries are stored in **this browser's localStorage**; attached media is saved in **this browser's IndexedDB**. This is **not a cloud account** and data will not sync across devices. Browser clearing, storage limits, or private browsing may erase it. Descriptions, guided answers and up to five summaries of previous issues for the active car are transmitted to your configured Llama endpoint for analysis. **V5 change:** When attached to the first chat message and sent, image/audio/video is temporarily uploaded to this Node server for processing; the temporary file is removed afterward. The optional audio model requires installation. External AI providers may receive text and derived media descriptions if configured. Audio/video is not silently uploaded before Send. Choose a provider you trust and avoid putting personal identifying information in descriptions.

## API

`GET /api/health`: reports backend setup (not actual Ollama readiness).

`POST /api/analyze`: JSON with `description`, Arabic canonical values for `timing`, `sound`, `location`, `frequency`, optional `language: 'ar'|'en'` and optional `history` (past case snippets). Returns `result` with `title`, `summary`, `severity` (`low`, `medium`, `high`), `reasons`, `nextSteps`, and `urgentSigns`.

## Status

- [x] Bilingual responsive frontend and theme toggle
- [x] Multi-car browser-local history and media playback
- [x] Backend with validation, free local Ollama adapter and past issue context
- [ ] Test all workflows against an installed Ollama model and different browsers
- [ ] Implement specialist audio/video classification model
- [ ] Deploy to a public host with accessible AI endpoint


## Data collection starter (November 2026)
- `data/knowledge_seed_v1.json`: 14 bilingual source-backed automotive symptom cards, including clickable original source URLs. Status: `source_reviewed`, **not mechanic confirmed**.
- `data/training_candidates_unreviewed.jsonl`: 14 synthetic chat examples derived from those cards; **do not train without mechanic review** and an independent evaluation set.
- `data/cases_template.csv`: blank template for collecting real cases with consent and outcome verification.
- `DATA_COLLECTION_GUIDE.md`: field definitions, privacy, RAG and evaluation recommendations.

These are starter educational reference records, not a diagnostic ground-truth dataset. The live app does not yet retrieve from these files automatically. A reliable next step is to add retrieval (RAG) using reviewed cards, then expand with actual independently verified service outcomes before QLoRA training.


## Audio source and automotive guidance research (November 2026)

- `data/audio_sources_v1.json`: **12** linked audio recordings with source attribution and licenses (10 Freesound CC0, 2 public-domain Wikimedia Commons). Audio **files are not downloaded into the repository**.
- `data/audio_dataset_catalog_v1.json`: **4** external collection leads with documented research and license constraints.
- `data/source_comments_v1.json`: **12** paraphrased evidence notes sourced from established automotive/consumer organizations (AAA, The AA, US FTC); not user comments or verified service cases.
- `data/AUDIO_SOURCES_README.md`: licensing, reliability distinctions and the suggested CLAP+RAG evaluation workflow.

These files are ready for review and future data ingestion; audio matching is **not yet integrated into the running app**.


## Expanded 1,000+ sound reference research

New in `data/`:
- `large_audio_dataset_catalog.json` — original large audio datasets with counts, licensing, access, quality and suitability.
- `LARGE_AUDIO_COLLECTION.md` — instructions, caveats and reproducibility.
- `../scripts/import_kwerimoto.py` — imports upstream KweriMoto **1,067-row manifest** into `data/imported/kwerimoto_index.jsonl` with an audit report. Run it yourself on a network-enabled machine. Only metadata is downloaded.
  
No 1,067 individual audio files or metadata rows have been imported into this GitHub repository yet. Publisher-reported sample counts must not be confused with data already downloaded or rights-cleared. See `data/LARGE_AUDIO_COLLECTION.md`.

## Project report documents

- [UPDATES.md](UPDATES.md) — development timeline, actual tools used, implemented features and work still pending.
- [REFERENCES.md](REFERENCES.md) — automotive knowledge, original audio sources, large datasets, licenses and technology references.


## Typed symptom knowledge retrieval (November 2026)
- `data/typed_symptoms_v1.json`: **40** bilingual automotive symptom reference cards including Saudi colloquial text variations, possible causes, cautious next steps, and publisher source links.
- `server/textRetrieval.js`: simple offline **keyword/phrase-based retrieval** from these cards, with Arabic text normalization.
- `POST /api/analyze` now retrieves up to **3** plausible cards based on the user's typed description and includes them in the Llama request as tentative source-grounded context. The API also returns `knowledgeMatches` with source URLs for debugging / future source display.
- The 40 cards summarize publications, **not mechanic-confirmed case diagnoses**. Keyword retrieval may miss synonyms or produce irrelevant matches; the app must never treat a match as proof of a fault.
- **Not implemented:** audio embeddings, semantic/vector RAG, automatic audio recognition, and mechanic-verified evaluation.

Example user descriptions: `السيارة ترج وهي واقفة`, `الدركسون يرج على الخط`, `الفرامل تحك`, `المكينة تحتر`, `car shakes at idle`.

Run `npm.cmd run check`, then test `npm.cmd run dev` with an available Ollama model. The new retrieval code is committed but has not been tested end to end against the user's Ollama instance.


## V4 — Natural AI chat (November 2026)

**New sessions open with a conversation instead of immediate multiple-choice questions.** Write a car problem in Arabic or English and send it; the frontend calls `POST /api/chat`, which passes the latest message, up to 12 previous chat turns, limited relevant text knowledge cards, and tentative vehicle history to the configured Llama endpoint. The AI should respond naturally and ask at most one useful follow-up question if needed.

- Chat messages are stored **locally per vehicle case** alongside previous analyses; older MCQ-based history entries remain viewable.
- No required four-question wizard for **new chats**.
- Initial audio/video attachments can still be saved and replayed locally; **Llama cannot hear them**. Additional attachments after a chat begins are disabled until multi-attachment storage is implemented.
- The old `POST /api/analyze` route is retained for compatibility with older code, while new chats use `POST /api/chat`.
- Requires a running local Ollama model or configured remote compatible model; **no live Ollama response was verified in this GitHub-only change**.
- Retrieval uses a source-grounded keyword matcher, not vector-semantic RAG, and retrieved symptoms are not confirmed diagnoses.

Test by running `npm.cmd run check`, `npm.cmd run dev`, then submit `السيارة ترج وهي واقفة` and follow with `وألاحظ إنها تزيد مع المكيف`. The AI should answer both without displaying the fixed multiple-choice questionnaire.


## V5 — text, photo, video and optional sound inference (November 2026)
- **Text chat:** `qwen3.5:2b` via Ollama; previous turns and publisher-source text retrieval; Riyadh local date inserted at request time to reduce stale-date answers.
- **Image/video visual understanding:** `qwen3-vl:2b` via a dedicated Ollama `/api/chat` request. Video samples at 0s and 2s using FFmpeg, **not full video temporal reasoning**.
- **Audio (optional):** Python/PyTorch/Transformers `laion/clap-htsat-unfused` scores sound-versus-text similarity; the model is **OFF by default** until installed and enabled. Similarity is not a mechanical diagnosis.
- **Backend:** `POST /api/media/analyze` processes an uploaded media file (25MB max) with a temporary file deleted on completion. `POST /api/chat` accepts optional cautious media observations as context.
- **Browser:** the selected media is sent **only after Send**; still retained for local history. Media processing errors produce an explicit warning and the textual conversation can continue.
- **Actual test status:** GitHub source and configuration are updated; the user's local Ollama, FFmpeg and CLAP environments have **not** been independently tested.
- **Setup:** [MULTIMODAL_SETUP.md](MULTIMODAL_SETUP.md). Existing private `.env` must be updated manually (the example alone does not change it).


## V5.1 — Saudi Arabic understanding and grounded responses (November 2, 2026)

Warshatak now uses an explicit, testable **Saudi dialect normalization and intent layer** for common car complaints. For example, `سيارتي ترج وهي واقفة` is understood as a vibration/rough-idle symptom and matched to a source-linked guidance card. The card's possible explanation and safe next step are shown directly, instead of asking a small language model to invent reasons. The AI chat remains available for less-clear or broader questions.

- `server/saudiUnderstanding.js`: Saudi aliases, combined symptom/context matching, follow-up awareness, and high-risk safety detection.
- `server/index.js`: known high-confidence automotive symptoms use publisher-based card answers before model inference; inconclusive free-form messages still use the configured AI model.
- `public/app.js` and `public/styles.css`: show source links below these **publisher-grounded** replies.
- `tests/saudiUnderstanding.test.js`: 7 regression tests for idling vibration, AC follow-up, Arabic normalization, English descriptions, ambiguous inputs, and brake safety.
- Run `npm.cmd run check` and `npm.cmd test` after `git pull origin main`.
- Verified in isolated code checks: 7 test cases passed. **Real browser integration on the user's PC is not yet verified.**

**Limitations:** Rule-based matching covers frequent expressions, not all Saudi dialects or every car. Publisher summaries are not mechanic-confirmed individual vehicle diagnoses. Low-confidence cases can still receive imperfect model-generated answers; always validate against actual inspection for safety-critical issues.
