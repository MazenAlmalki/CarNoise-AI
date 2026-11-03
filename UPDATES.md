# Development Log — ورشتك | Warshatak

**Updated:** November 3, 2026
**GitHub repository:** https://github.com/MazenAlmalki/CarNoise-AI  
**Repository name:** `CarNoise-AI`; **application name:** `ورشتك / Warshatak`

This log documents the work visible in our development conversation and GitHub repository. It distinguishes **implemented in source**, **locally reported working**, and **not yet implemented/tested**. It is a retrospective summary, not a claim that every feature has been fully tested in production.

## November 3, 2026 — Coordinate reply text with actual voice start

Automatic read-aloud now reveals a new non-urgent reply when actual speech playback starts, rather than displaying the text and starting a long separate wait for sound. Added Show text now and a 15-second automatic-start fallback that reveals text and cancels delayed speech. Errors, cancellation and navigation also release text. Urgent warnings and text-only/muted use remain immediate. Complete replies are saved normally; there is no persisted hidden-message state. Existing amplitude-based mouth movement, speech cache, single synthesis call, server-side keys and provider settings remain. This is start synchronization, not word-level lip/timestamp alignment or a claim of faster live Gemini generation.

Validation: 145 Node tests pass. Browser tests use mocked speech latency and real PCM playback to check co-start, quota fallback, text-now cancellation, 15-second timeout, saved history and automatic speech disabled. Live provider latency remains unverified.

## November 3, 2026 — Intro on every visit

The silent intro now opens on every page load and refresh, regardless of the old first-visit flag. It still waits for Start chat, fades to the composer, and preserves vehicles/history/language. Browser regression covers reload with the legacy seen flag set.

## November 3, 2026 — Listen to a reference example

Added one user-played reference example after a successful Gemini raw-audio comparison, with Close/Different/Not sure/Skip feedback. The server validates IDs against the hash-checked library and reserves the reply's single question for the example, respecting the two-question budget, urgency, speech/failure guards and offered-example history. Feedback is local, unverified resemblance, never a confirmed fault or training label. Playback uses the real WAV without a TTS call; players stop on recording, navigation, or other playback. Unknown references fail closed.

Changed the single-screen silent intro to wait for its central Start chat button, then fade and focus the composer. Grouped secondary sidebar controls under one Settings entry. Vehicle IDs/history/media are preserved.

Validation: 142 Node tests passed; browser checks used mocked provider replies but real WAV HTTP playback, IndexedDB, synthetic microphone input and feedback persistence. Existing bilingual vehicle/history smoke checks passed, including accessibility checks. Live Gemini recognition remains unverified. Dataset readiness remains blocked: 15 references with pending independent acoustic review, no independent held-out recordings. No external recording license/reuse permission was established and no new recordings or training results were invented. Details: [REFERENCE_COMPARISON_REVIEW.md](REFERENCE_COMPARISON_REVIEW.md).

## November 3, 2026 — Single-screen intro

Replaced the multi-scene intro and start gate with one silent logo/name/tagline screen that opens automatically and fades into the chat in 2.4 seconds. Retained skip, keyboard exit, language, replay and existing first-visit preferences; reduced motion uses a shorter static welcome. Removed unused scene/caption/particle markup and CSS. No voice, data or provider configuration changes.

## November 3, 2026 — V2 garage, voice timing and audio evidence

Implemented a narrow vehicle dropdown, per-vehicle searchable conversation history, additive meaningful titles/renaming and one overflow control per thread. Existing IDs, messages and IndexedDB media links are preserved; deletion still confirms. Added a copyable problem summary separating reported symptoms, automatic transcripts, model possibilities, uncertain audio observations and absent confirmed mechanical findings. Users can skip clarification and request a summary.

Added actual microphone-energy visualization and a brief reply-ready mechanic reaction. Existing real-WAV amplitude mouth synchronization, cancellation, opt-in Arabic/English speech and the **silent** intro remain. Uploading/analyzing states now follow actual upload-completion events; slow requests can be cancelled/retried.

Measured local audio baseline before editing. Waveform inspection now overlaps normalization/inference; video frames/vision overlap audio. Reference bytes/base64 are cached with manifest/file-metadata invalidation and hash checks on reload. Added media/chat/voice timings without user-content logs or credential changes. See [WARSHATAK_V2_REVIEW.md](WARSHATAK_V2_REVIEW.md) for measured scopes, benchmark commands and browser checks. No live latency or Arabic-voice quality claim is made.

All 15 original WAVs and provenance are retained. Manifest v2 separates uploader-suspected component labels from pending independent acoustic reviews. Added a two-video source inventory, controlled model acoustic-category vocabulary and a reproducible evaluator that rejects same-file/source leakage and fault-label ground truth. Current readiness: 15 references, zero independent reviewed test recordings, metrics unavailable. No training, fine-tuning or verified fault accuracy is claimed. See [data/car-audio/README.md](data/car-audio/README.md).

The older sections below are a historical snapshot; their Ollama/local-only descriptions do not describe the current hosted Gemini/Groq-compatible paths.

## 1. Project purpose

Build an Arabic-first, Saudi-relevant car-noise assistant. Users describe unusual sounds, answer guided questions, and receive *possible* explanations, urgency indicators, and cautious next steps. Later goals include matching actual recorded sounds to a permission-cleared audio library, retrieving vetted automotive knowledge, and supporting a separate history for each car.

## 2. Tools and technologies

| Tool / technology | How it was used | Status |
|---|---|---|
| ChatGPT | Idea development, interface and application code drafting, GitHub edits, source cataloging and documentation | Used |
| GitHub | Repository `MazenAlmalki/CarNoise-AI`, commits and code/document history | Used |
| Git | Suggested for `clone`, `pull`, `push`; local Git actions depend on user's setup | Workflow provided; repository hosted |
| Visual Studio Code | Local editor and PowerShell terminal for app setup | User-reported use |
| HTML5 | Arabic/English UI, responsive dashboard, forms and media input | Implemented |
| CSS3 | Light/dark modes, layout, animations, hover states, responsive design and reduced-motion support | Implemented |
| Vanilla JavaScript | Guided chat, state, localization, vehicle management, media handling and fetch | Implemented |
| Browser localStorage | Remembers cars, histories, language/theme preferences | Implemented; local device only |
| Browser IndexedDB | Stores audio/video media locally | Implemented; local device only |
| Browser MediaRecorder API | Captures microphone audio, with browser permission | Implemented in code; browser compatibility not independently verified |
| Node.js (20+) | Runs server and development commands | Used; app server reported running locally |
| npm | Installs dependencies and runs `npm.cmd run dev` on Windows | User-reported use |
| Express | Serves frontend and HTTP analysis/health endpoints | Implemented |
| dotenv | Reads server environment variables from `.env` | Implemented |
| Helmet | Basic HTTP security headers | Implemented |
| express-rate-limit | Limits API requests | Implemented |
| Meta Llama 3.2 3B | Intended text reasoning model for automotive explanations and structured JSON | Local Ollama adapter implemented; end-to-end model response not independently verified |
| Ollama | Free local Llama execution and OpenAI-compatible HTTP endpoint at `127.0.0.1:11434` | User installed application and worked on model setup |
| Python 3 standard library | Metadata importer for public KweriMoto manifest | Import script written; not executed against upstream file here |
| OpenCode | User selected it in Ollama and discussed using it for integration | Mentioned/selected; independent project edits by OpenCode not verified |

### Researched but **not used in a completed feature**

| Technology | Planned role |
|---|---|
| CLAP | Convert audio to embeddings and search for acoustically similar clips |
| FAISS | Index and retrieve nearby audio embeddings |
| RAG | Retrieve vetted automotive guidance for Llama before generating advice |
| SQLite / vector database | Potential structured knowledge and vector storage |
| LoRA / QLoRA | Optional fine-tuning experiment, not needed for the current pipeline |
| PyTorch / Unsloth / Google Colab | Optional cloud training tools; no Warshatak fine-tuning job confirmed |
| Public cloud hosting | Planned website deployment; no verified public deployment URL |

## 3. Development history (in order)

### Phase 1 — Initial concept and GitHub setup
- Named the first concept **CarNoise AI — وش صوت السيارة؟**
- Created the public GitHub repository `MazenAlmalki/CarNoise-AI`.
- Added `package.json`, `.env.example`, `.gitignore`, `README.md`, and `OPENCODE_TASK.md`.
- Built initial Arabic RTL landing page and four-question chat.
- Added Express `/api/health` and `/api/analyze`, input validation and provider error handling.

### Phase 2 — Local setup and Ollama
- Helped troubleshoot PowerShell's `npm.ps1` script restriction by using `npm.cmd`.
- Helped find the extracted project folder containing `package.json` after an ENOENT error.
- User reported the local app server running.
- Prepared backend to use Ollama's local chat completion endpoint without an API key.
- Discussed Llama 3.2 3B and smaller 1B as a performance alternative for an 8GB RAM laptop.
- User installed Ollama and checked model availability; complete model-based analysis remains to be verified.

### Phase 3 — UI redesign, languages, themes, and vehicle history
- Introduced a more polished responsive layout with motion effects and reduced-motion accommodation.
- Implemented Arabic/English UI and server language instructions.
- Added dark/light themes and saved preferences.
- Added multi-vehicle folders, independent issue histories and result records.
- Added previous issue summaries (up to five per car) as **tentative context** for future Llama requests.
- Used browser localStorage, not a hosted user database.

### Phase 4 — Audio/video and brand update
- Added recording through the microphone, audio/video attachment selection (up to 25 MB) and playback.
- Stored recordings in browser IndexedDB, not GitHub or the backend.
- Rebranded the UI to **ورشتك / Warshatak**, while leaving the repo URL unchanged.
- Added per-file, per-issue-record and entire-vehicle deletion controls with confirmation prompts.
- Added violet/teal aurora theme, hover motion, transitions and a chat-style animated typing state rather than a named “Llama loading” message.
- **Not implemented:** interpreting the actual sound in attached files. Llama 3.2 text-only does not analyze raw uploaded audio/video.

### Phase 5 — Research and initial knowledge collection
- Added `DATA_COLLECTION_GUIDE.md` and blank `data/cases_template.csv`.
- Compiled 14 bilingual, source-grounded knowledge cards in `data/knowledge_seed_v1.json`.
- Drafted 14 **unreviewed synthetic training conversation candidates** in `data/training_candidates_unreviewed.jsonl`.
- Added 12 paraphrased external technical guidance entries in `data/source_comments_v1.json`.
- Recommended RAG before fine-tuning. Neither actual knowledge retrieval nor QLoRA training is implemented yet.

### Phase 6 — External audio reference collection and scaling
- Cataloged 12 individual sound pages, creators and licenses in `data/audio_sources_v1.json`; no audio bytes were committed.
- Cataloged OtoMobile, KweriMoto, Procedural Engine Sounds and vehicle-engine recordings; later added AudioSet in `data/large_audio_dataset_catalog.json`.
- Added `data/AUDIO_SOURCES_README.md` and `data/LARGE_AUDIO_COLLECTION.md`.
- Created `scripts/import_kwerimoto.py` for a publisher-reported 1,067-clip dataset's **metadata only**.
- The importer has **not** been executed or validated against the remote manifest in this repo. No 1,067 actual clips were downloaded or integrated.

## 4. Current implementation and gaps

| Feature | Current assessment |
|---|---|
| Arabic/English UI, themes and transitions | Implemented in frontend source |
| Vehicle folders and separate histories | Implemented in browser-local storage |
| Attach, record and play media | Implemented in frontend code; not independently cross-browser tested |
| Delete media/history/entire vehicle | Implemented with confirmation and local storage cleanup |
| Four-question diagnostic-style text flow | Implemented; should communicate only possibilities |
| Ollama / Llama adapter | Implemented; real model performance still needs integration testing |
| Use of previously stored car issues | Sent as context; prior guesses aren't confirmed facts |
| RAG from reviewed knowledge cards | **Not implemented** |
| CLAP + FAISS audio similarity | **Not implemented** |
| Audio recognition of uploaded video/audio | **Not implemented** |
| LoRA / QLoRA fine-tuning | **Not performed** |
| 1,067-record imported sound index | **Importer provided, not imported** |
| Public deployment | **Not verified** |

## 5. Data acquired and its actual status

| Item | Count | Stored? | Meaning |
|---|---:|---|---|
| Automotive knowledge cards | 14 | Yes, JSON | Publisher-based possible causes, not mechanic-verified individual repairs |
| Synthetic training candidates | 14 | Yes, JSONL | Examples generated for later review, not training-ready ground truth |
| Published technical summary notes | 12 | Yes, JSON | Paraphrases of original publishers' guidance |
| Individual sound sources | 12 | Source URLs only | Audio recordings not downloaded |
| KweriMoto dataset | 1,067 (publisher-reported) | Catalog and importer only | Actual manifest rows/audio not imported |
| Procedural engine collection | 5,935 (publisher-reported) | Catalog only | Synthetic / noncommercial |
| Vehicle combustion collection | 475 (publisher-reported) | Catalog only | Operating sounds, not confirmed faults |
| OtoMobile | 65 (publisher-reported) | Catalog only | Restricted mechanic-informed research dataset |
| AudioSet | ~2.08 million (all classes, publisher-reported) | Catalog only | General sound events, not an automotive fault dataset |

For exact URLs, access conditions, data quality and licenses see [REFERENCES.md](REFERENCES.md).

## 6. Reproducing the work

```powershell
git clone https://github.com/MazenAlmalki/CarNoise-AI.git
cd CarNoise-AI
npm.cmd install
npm.cmd run dev
```

Use Ollama with a locally installed Llama model, or configure an authorized remote compatible provider via `.env`. Never commit API keys.

For metadata indexing (does not download audio):

```powershell
python scripts/import_kwerimoto.py
```

## 7. What to work on next

- Verify the actual model is available in Ollama and test real Arabic and English analyses end to end.
- Test car history, deletions, microphone/media behavior and storage in different browsers.
- Review technical knowledge cards with a qualified mechanic and establish evaluation cases.
- Implement RAG over approved source-grounded knowledge.
- Acquire rights-cleared recordings, build and validate a CLAP-based audio similarity experiment, including unknown/ambiguous outcomes.
- Consider fine-tuning only after baseline evaluation shows a clear need.
- Deploy an accessible public version with an appropriate hosted Llama inference service.

**Evidence of implementation:** GitHub commits, existing source and documentation. **Evidence still needed:** performance metrics, user study, dataset/license verification, and end-to-end screenshots or test reports. Add those as they become available rather than claiming unperformed tests.


### Phase 7 — Typed automotive descriptions and lightweight text RAG (November 1, 2026)
- Added **40** bilingual knowledge cards in `data/typed_symptoms_v1.json`, covering brakes, engine, cooling, steering, wheels, suspension, transmission, starting, electrical symptoms, and more.
- Added Saudi Arabic conversational aliases (e.g., `الفرامل تحك`, `المكينة تحتر`, `السيارة ترج وهي واقفة`) and English equivalents.
- Implemented `server/textRetrieval.js`: local Arabic-normalized keyword and phrase search (not ML embeddings).
- Updated `server/index.js` so `POST /api/analyze` retrieves up to three candidates based on typed descriptions and forwards their source URL, possible causes, and next steps to Llama. Response now includes `knowledgeMatches` as structured metadata.
- Source material drawn from consumer automotive advice by the U.S. FTC, AAA, The AA, and RAC. Each card contains a URL, and none claims to be mechanic-confirmed ground truth.
- **Remaining:** test retrieval quality, Arabic aliases, and live Ollama end-to-end; build a separate emergency-rules check; evaluate false matches and add source badges in UI; no audio classification yet.


### Phase 8 — Conversational AI chat instead of mandatory MCQs (November 2026)
- Removed the forced four multiple-choice questions for **new conversations**.
- Added `POST /api/chat` in Express with a natural Saudi Arabic / English conversational system prompt; Llama should answer a user's initial description directly and request clarifying details conversationally if necessary.
- Added multi-turn context: sends up to 12 recent chat messages alongside up to 3 retrieved text knowledge cards and unconfirmed previous vehicle history.
- Updated `public/app.js` to retain per-case chat turns in browser-local history, submit follow-ups through the same composer, show animated response loading, and preserve optional initial media replay.
- Updated the landing page and composer copy to invite chatting rather than starting a structured diagnosis form.
- Preserved old `POST /api/analyze` and saved legacy MCQ cases; new chats no longer use the question wizard.
- **Not yet verified on a running Ollama model**; the source commits need `npm.cmd run check` and real browser testing.


### Phase 9 — Multimodal architecture, current-date grounding and model upgrades (November 1, 2026)

- Investigated current compact models for low-memory hardware. Recommended `qwen3.5:2b` for chat and `qwen3-vl:2b` for photo/video frame observations; both use the local Ollama service.
- Added `CHAT_MODEL`, `VISION_MODEL`, `OLLAMA_HOST`, `ENABLE_AUDIO_CLAP`, `AUDIO_PYTHON`, `FFMPEG_PATH`, `CLAP_MODEL` settings in `.env.example`. Existing user `.env` is **not automatically modified**.
- Added `server/multimodal.js`: accepts bounded image/audio/video media, processes image with Qwen3-VL, samples video frames with FFmpeg, optionally runs a separate CLAP model on video soundtrack or audio.
- Added `scripts/analyze_car_audio.py`: optional Python CLAP zero-shot sound-to-description similarity. Returns ranked *similarity scores*, NOT mechanic-verified fault diagnoses.
- Updated `server/index.js` with `POST /api/media/analyze` using maintained Multer multipart parsing (25MB max), and feeds media observations into the main chat route as uncertain context.
- The chat route now includes the current date calculated in the **Asia/Riyadh** time zone, specifically to reduce outdated-date responses (like “September 2023”). This is a prompt-based improvement, not guaranteed date accuracy if model fails to obey.
- The frontend now accepts **photos plus video/audio**, uploads a selected attachment only upon the user pressing Send, and offers a visible warning rather than pretending analysis succeeded when media prerequisites are missing.
- Privacy change: media retained in browser IndexedDB and **temporarily uploaded to the app backend upon Send**. Local temporary files are removed after inference. Real production deployment needs privacy/security review and user consent design.
- Added `MULTIMODAL_SETUP.md` with Windows installation instructions and model limitations; updated UI labels, README, and model settings.
- **Unverified:** required models installed on the user's laptop, end-to-end real inference, performance with 8 GB RAM, FFmpeg runtime, and optional Python CLAP dependencies. Audio matching is OFF by default until setup.


- Added `GET /api/model-status` to report local Ollama reachability, configured text/vision models and installed tags (not a full inference test).
- Improved low-memory behavior by unloading the vision model after its request, and enabled file-only media submissions without mandatory text.
- Updated sidebar privacy notice to distinguish local vehicle history from temporary upload of user-submitted attachments.

### V5 local chat speed optimization (November 2, 2026)
- Switched **local** chat requests to Ollama native `/api/chat` so `think:false` disables extended thinking in models supporting that option.
- Set `CHAT_MAX_TOKENS=220` and `CHAT_CONTEXT=2048` as tunable defaults, reduced passed chat history to 6 turns, and retrieved keyword reference cards to 2.
- Kept the vision and optional CLAP paths unchanged. This is a source-level update, not a verified performance benchmark on the user's 8GB Windows machine.
- Check speed and response quality locally; lower token limits can produce truncated responses.


### Phase 10 — Fix poor Saudi Arabic replies (November 2, 2026)
- Added `server/saudiUnderstanding.js` to normalize colloquial phrases including `ترج` (shaking), `المكينة` (engine), `القير` (transmission), `دركسون` (steering wheel), `البريك` (brakes), and other frequent expressions.
- Added composite intent rules that require symptom **and** context, preventing isolated ambiguous words from becoming definite diagnoses.
- Known high-confidence symptoms now respond directly using the corresponding existing, source-linked publisher-guidance card. For example, idling vibration returns cautious engine-performance explanations and follows up about AC rather than making up tire/road causes.
- Recent turns such as `إيه تزيد مع المكيف` reuse the earlier symptom context.
- Added first-priority safety guidance for explicit severe brake/steering/fire/overheating warnings.
- Added compact publisher reference links to grounded responses in the chat UI.
- Added 7 regression tests and `npm.cmd test`; all 7 passed in isolated logic checks; real end-to-end browser test with local Ollama still pending.
- **No fine-tuning performed.** This uses deterministic normalization + existing source-grounded JSON, with the language model reserved for lower-confidence or broader conversation.


### Phase 11 — Replace scripted answers with real contextual AI chat (November 2, 2026)

- User feedback: earlier deterministic symptom-card replies appeared instant and scripted, even though they reduced poor-quality small-model guesses.
- **Removed** the high-confidence `groundedResponse(...)` short-circuit from the live `POST /api/chat` route. All normal chat messages now go through the configured language model for response generation.
- **Kept** Saudi Arabic phrase normalization, conversation context, source-backed symptom retrieval, and safety-critical signal detection as supporting context.
- Reworked system instructions to have the model account for user intent, previous turns, and verified uncertainty; the assistant should ask one natural follow-up only when useful, rather than repeating fixed templates or MCQs.
- Added a safety warning layer for clearly severe driving-related symptoms; it should not imply confirmed diagnosis.
- Grounded source links are still surfaced beneath language-model replies when references were retrieved (note: retrieval matches can be imperfect).
- Added `CHAT_THINK` (default `0`, optional `1`) and adjusted default `CHAT_MAX_TOKENS=320`, `CHAT_CONTEXT=3072`. Thinking enabled can be much slower on CPU-only inference.
- **No locally running Ollama model was tested from this GitHub update**; validate speed and reply quality in the app. Source-only checks do not prove diagnostic quality.


### Phase 12 — Saudi automotive data expansion + better unclear-input behavior (November 2, 2026)

- Added **1,200** transparent **synthetic** Arabic user-utterance variants (30 per existing 40 source-linked symptom cards). They represent language variations, **not** 1,200 real repairs, independently proven problems, or sound clips.
- Added **124** manually authored colloquial aliases across 37 symptom cards. The backend now includes these in runtime text retrieval.
- Added **7** Saudi official-reference notes: Ministry of Commerce recall lookup and selected 2025–2026 limited recall notices, Civil Defense summer safety, and tire-labeling conformity context; avoid claiming any make/model is recalled without official VIN verification.
- Added `server/saudiKnowledge.js` with relevant source retrieval and conversation hints for incomplete descriptions, failed audio interpretation, user corrections and uncertain matches.
- Added `data/conversation_fallback_examples_v1.json` with **15** bilingual desired behaviors for natural follow-up and error-handling dialogues; these are not fixed customer-response templates used verbatim.
- Updated `POST /api/chat` to pass original user text, normalized Saudi wording, publisher-linked symptom matches, targeted official Saudi context, and uncertainty guidance to the **actual language model**, which composes its own reply.
- Frontend now tells chat when media analysis fails instead of letting the model presume it heard or saw an uploaded file.
- Created `tests/saudiCorpus.test.js`, configured portable Node test discovery and expanded JS syntax checks; indexed phrase retrieval verified for **1,200 / 1,200 synthetic variants (top-3)** in isolated evaluation.
- Created `SAUDI_KNOWLEDGE_REPORT.md` for dataset provenance, references and limitations.
- **Not completed:** 1,000 verified diagnosis cases, real end-to-end auto sound recognition, technician label review, actual user validation, or a full performance benchmark on the user's local model.


### Phase 13 — Saudi slang and unusual conversational requests (November 2, 2026)

- Created `data/saudi_dialect_glossary_v1.json` with **128** contextual Saudi dialect expressions covering vehicle parts, noises, conditions, normal conversation, slang corrections, ambiguous terms and polite/short prompts.
- Created `data/saudi_conversation_edge_cases_v1.jsonl` with **204** generated test utterances from 51 scenario seeds: silly/joking claims, unclear problems, non-car questions, follow-ups, corrections, unusual metaphors, safety-critical prompts and failed audio/video analysis. These examples are **synthetic** and do not establish verified diagnoses.
- Added `server/saudiDialect.js` for context-scoped glossary matching and intent detection. Only up to 5 short definitions are passed to the actual LLM, which still creates responses.
- Updated `server/saudiKnowledge.js` to avoid responding to greetings or jokes as if they were defective car components.
- Updated `server/index.js` to supply Saudi-language interpretations and conversational behavior guidance to text chat while retaining the previous retrieved automotive references and uncertain media analysis status.
- Added `tests/saudiDialect.test.js` and included the new module in `npm.cmd run check`.
- Created `SAUDI_DIALECT_GUIDE.md` with provenance, examples, test instructions and limitations.
- Isolated syntax/logic checks passed for key edge cases; final quality still requires **real conversation testing** on the user's locally installed Ollama model. Audio diagnosis has **not** become available automatically.


### Phase 14 — Saudi car terms + English text support (November 2, 2026)

- Fixed the backend selecting the reply language solely from the UI session: `server/chatLanguage.js` now detects English or Arabic from the typed text; ambiguous short messages fall back to UI language. The AI prompt explicitly prioritizes the detected language.
- Added `data/saudi_car_terms_v1.json`: **89** car-part and symptom definitions with **317** aliases, including `بوري` (horn), `جلنط` (parking brake), `سلف` (starter), `دينمو` (alternator), and context-dependent terms (e.g. `شمعات`).
- Added `data/saudi_car_dialogue_examples_v1.jsonl`: **1,068** synthetic Arabic/English dialogue examples (12 per term), covering explaining terminology, unclear wording, noise complaints, warning lights, translation, and asking focused clarification questions. These are NOT 1,068 verified faults or fine-tuning examples used by the model at runtime.
- Added `server/saudiCarTerms.js` to retrieve just a few relevant meanings and clarification cues per message without bloating the CPU-bound Ollama prompt.
- Updated `POST /api/chat` to include the new terms and answer in the detected user-text language. The actual language model still writes the reply.
- Updated `public/app.js` to show English/Arabic chat content with automatic per-message text direction.
- Added `tests/saudiCarTerms.test.js`, added new JS modules to `npm.cmd run check`, and created `SAUDI_CAR_TERMS_AND_ENGLISH.md`.
- Source-level checks passed in code evaluation for bilingual routing and horn/parking-brake matching. Final English end-to-end test on the user’s Windows/Ollama installation is still required.


### Phase 15 — Stop robotic replies, retain context and activate lightweight media (November 2, 2026)

- Replaced the verbose system prompt with an explicit **natural conversational style**: no `يا بطل`, `يا غالي`, `حبيبي` or repetitive `أهلاً بك` introductions, no unwarranted numbered lists, and one contextual clarification maximum. Small-model output cleanup strips repeated pet-name phrases.
- Created `server/conversationContext.js` to retain the original user-described problem plus recent conversation turns and detect common follow-up phrasing; the frontend sends the first user message plus ten most recent turns to avoid oversized API requests.
- Reactivated attachment/record buttons after a conversation starts. New clips can be recorded or uploaded on follow-up turns and analyzed when sent.
- Added `server/audioWaveform.js`: uses local FFmpeg to decode short clips and produce basic acoustic measurements (quiet/loud, intermittent/steady, coarse frequency texture, clipping). **Cannot recognize a squeal, horn, or vehicle defect**; no fake claims of having identified car faults from audio.
- Updated `server/multimodal.js` to use waveform analysis for audio and soundtracks of videos, even when heavyweight CLAP remains disabled. Video retains sampled still-frame vision when available.
- Added `server/mediaStatus.js` and `GET /api/media-status` to report FFmpeg readiness. `MULTIMODAL_SETUP.md` now contains Windows setup/testing instructions.
- Created `tests/conversationMedia.test.js` and expanded `npm.cmd run check` to include new modules.
- **Still requires on-device test:** FFmpeg availability, actual browser microphone permissions, Ollama vision response time, and accuracy of the language model's multi-turn answers. Audio waveform features do not replace specialized sound recognition.


### Phase 16 — Fix disabled Record/Attach buttons after messages (November 2, 2026)

- Found the actual UI issue: `renderSession()` disabled the Record and Attach controls while `submitting=true`, but `sendChat()`'s `finally` block only restored Send and the text input. The media controls remained disabled for the rest of the thread.
- Fixed the `finally` block to reactivate Record and Attach after any response or error, without allowing a new recording during a pending request.
- Added `tests/mediaButtons.test.js` to check the cleanup and follow-up attachment path.
- Users still need FFmpeg installed for lightweight audio/video decoding and browser microphone permission for live recording. These are separate dependencies from enabling the buttons.
- Source review and syntax checks do not confirm that browser microphone access or FFmpeg are available on the user's Windows machine.


### Phase 17 — Ask the user to identify an unclear recording (November 2, 2026)

- If an uploaded audio clip has no reliable recognized speech and no audio-event interpretation, the assistant now **does not invent a car noise or fault**. It says the recording could not be identified and presents **seven clickable descriptions**: spoken words, clicking, squealing, whistling, humming, vibration, or something else.
- If the media pipeline failed outright, the same clarification choices appear instead of a fake audio analysis.
- The choice is sent as an explicit **user description**, not claimed as a model observation. The rest of the chat can then ask one question based on the selected description.
- Selection chips are stored with the assistant chat message and can be used in that conversation; older choices become inactive. Fixed a pending-state issue so newest chips are enabled after the response completes.
- Short video clips with no successfully analyzed visual frames can also use the clarification flow. Video with actual visual observations still gets the normal vision-limited response.
- Added `tests/audioClarification.test.js` covering available choices, fallback routes and frontend click behavior.
- **No new sound-recognition capability is claimed**: clicking "صرير" is the user's own description, not acoustic classification.


### Phase 18 — Fix premature audio clarification (November 2, 2026)

- User correctly reported that an actual vehicle sound was followed immediately by sound-description choices. Root cause: the backend treated `!transcription` and no `CLAP` matches as failed sound recognition even when a sound classifier **had not run at all**. A successful waveform analysis is not sound identification.
- `server/multimodal.js` now reports `audioEventAnalysis: { attempted, model, succeeded }`, so the chat can distinguish classifier disabled, classifier failed, and a classifier returning candidate sounds.
- `server/index.js` now **does not** show sound-choice suggestions when CLAP is disabled. Instead it explicitly says sound-event recognition is not configured. Only after a **real CLAP attempt fails** may it offer user-provided sound descriptions. If the classifier returns candidate similarities, the LLM discusses them cautiously without claiming a confirmed fault.
- Missing speech transcription is separate: Whisper is optional and needed to process recorded words such as `السلام عليكم`; sound-event similarity cannot reliably transcribe speech.
- Updated `tests/audioClarification.test.js` to ensure choices require an actual classifier attempt.
- On the user's Windows 8GB system, optional CLAP and Whisper may require significant downloads and RAM. Do not claim sound event recognition is working until dependencies are installed and an actual test succeeds.


### Phase 19 — Broaden CLAP automotive sound matching (November 2, 2026)

- Investigated the user-reported mismatch with sounds from a supplied YouTube Short (`Mb-7s4JxFP4`). The actual YouTube audio was **not accessible for inspection or end-to-end testing** here; **no sound labels were taken from or asserted about that video**.
- Found an actionable limitation: the previous CLAP script compared each recording against only **16 text descriptions**, including unrelated background classes; any real sound absent from these candidates was forced toward another description.
- Added `data/car_audio_captions_v2.json` with **67 author-curated** English sound captions covering engine idle/knock/rattle, starting and electrical sounds, belts/AC/fans, brakes/tires/steering, suspension/transmission/exhaust and ambient human sounds. These are **candidate descriptions**, not samples, labels, actual Youtube soundtrack analysis or confirmed faults.
- Updated `scripts/analyze_car_audio.py` to analyze **up to 20 seconds in two 10-second windows** (where enough audio exists), compare against 67 candidates and return the **top five** descriptions and a relative margin. CLAP is still a similarity ranker, not a validated fault-diagnosis classifier; its raw similarity values are **not real-world diagnosis probabilities**. A nearly silent clip returns **no candidate**, not a forced noise label.
- Updated the chat to avoid asserting sound identities or faulty components based on a near match. A processed-but-silent clip leads to a re-recording suggestion; an unconfigured classifier is reported as such, and classifier errors can trigger user-supplied clarification.
- Added `tests/carAudioCatalog.test.js` for sound-category coverage, provenance and two-window processing contract.
- **Not completed:** listening to the user's YouTube Short or benchmarking against its individual sounds, verified per-class accuracy, or running CLAP on the user's Windows laptop. Real audio clips are required for reliable evaluation. Increasing candidate captions is not training the model weights.


### Phase 20 — Fix misleading audio fallback and duplicate clip previews (November 2, 2026)

- User screenshot showed sound-description chips after a 4-second recording along with the same recording rendered more than once.
- Root cause 1: a genuine CLAP runtime failure was handled as if sound-event classification had merely been inconclusive, immediately displaying guesses/choices. Backend now returns `audio-classifier-error` with a bounded relevant warning from the CLAP process rather than proposing sound labels. `public/app.js` surfaces the actual error, so model installation/runtime problems can be fixed instead of masked.
- Root cause 2: `showSavedMedia()` loaded files from IndexedDB asynchronously during multiple successive `renderSession()` calls, allowing an older media preview to be appended after a newer one. It now guards against stale render generations and removes any previous preview in its target before attaching the current one. Object URLs are released when the preview is detached.
- Updated frontend wording to distinguish successful audio upload/waveform processing from real sound recognition.
- Added `tests/mediaRenderFailure.test.js` and corrected prior `tests/audioClarification.test.js` expectations.
- This is a source-code fix; run `npm.cmd test`, confirm the CLAP error shown in the UI, and verify with a fresh short recording on the target laptop. Failed CLAP may still require installing Python dependencies, additional RAM or changing the inference model.


### Phase 21 — Public YouTube sound research + three-stage clarification (November 2, 2026)

- Compiled **28 video-topic metadata records from 8 real YouTube videos**, with source URLs, publisher/channel, source-described timestamps where available, suggested discussion categories and explicit unverified-audio labels. No audiovisual assets were downloaded and no labels were inferred from unheard recordings.
- Added `data/sound_description_examples_v1.jsonl` with **536 synthetic phrasing examples** mapped to the 67 existing CLAP caption categories. This is an additional language testing corpus, **not real sound training**.
- Added `server/soundReferences.js` to supply relevant public video topic links as *background reading* based on explicit user descriptions. Video metadata is not evidence of the user's sound.
- Added `server/soundInterview.js` with a **3-step interview** for unrecognized sounds: location (6 choices), timing (8 choices), and sound texture (10 choices). Responses are accumulated as **user descriptions**, never presented as automatic audio findings.
- If CLAP is enabled but produces no useful match or errors, the bot explains the situation and asks one focused question at a time. If CLAP is not configured at all, it instead presents **one optional Start describing sound** action before asking questions; this avoids repeating the earlier bug of immediately forcing noise choices on genuinely uploaded recordings.
- The UI saves the guided interview stage in the reply and sends validated user choices to the backend; only after all three choices does the regular LLM generate an explanation informed by description and retrieved general evidence.
- Added `tests/soundInterview.test.js` and updated older media clarification regressions, and included new server modules in the JS syntax check.
- Source checks confirm 28 references, 536 synthetic descriptions, JS syntax validity and successful isolated 3-stage progression. Real CLAP accuracy and browser click-through require local on-device tests.
- Details: `SOUND_RESEARCH_AND_GUIDED_QUESTIONS.md`. **No YouTube audio was downloaded, used for fine-tuning or verified as a labeled recording.**


### Phase 22 — Switch text assistant from local Qwen to hosted Llama API (November 2, 2026)

- Replaced the default chat model with **Meta Llama 3.3 70B Instruct**, hosted through OpenRouter's OpenAI-compatible Chat Completions endpoint. Groq deprecated public access to its Llama 3.3 offering for standard accounts in August 2026, so OpenRouter was selected instead.
- Created `server/chatProvider.js` for configurable HTTPS-only remote text inference, required backend-only API credentials and public non-secret provider status.
- Updated **both** `POST /api/chat` and legacy `POST /api/analyze` to use the configured hosted chat endpoint and Meta Llama model. Preserved automotive RAG, Saudi dialect support, conversation history and prompt safety guidance.
- Updated `/api/model-status` and `/api/health` to report hosted text provider separately from local Ollama video/image vision readiness, instead of incorrectly treating the hosted text model as a local Ollama tag.
- Updated `.env.example`, added `HOSTED_LLAMA_API_SETUP.md`, created `tests/chatProvider.test.js`, and extended syntax check to cover provider code.
- To activate, **the user must add their own secret** `CHAT_API_KEY` in the local `.env` and remove/replace old `CHAT_MODEL` Qwen setting. No user private credential was read, generated or changed in the repository.
- **Scope:** the chat and legacy analysis model are switched. Vision still uses local `qwen3-vl:2b` and audio is handled separately; this is not a complete migration of every modality to Meta Llama.
- Source-level tests/checks do not establish a successful authenticated API request; test locally with the user's valid API key. Cost, privacy and hosted provider rate limits apply.


### Phase 23 — Remove Qwen from active runtime, add Context Engine and hosted Llama vision (November 2, 2026)

- Replaced local Qwen image/video still-frame inference with **Meta Llama 4 Scout API** using OpenRouter. The same secret server-side `CHAT_API_KEY` now powers both Llama 3.3 chat and Llama 4 Scout vision.
- Removed Qwen and Ollama from the active backend, `.env.example`, model-status checks, and current setup guides. Audio continues through FFmpeg with optional local CLAP/faster-whisper; these are not Qwen-dependent.
- Added `server/llamaVision.js` to send one image or up to two extracted video JPEG frames via OpenRouter's OpenAI-compatible `image_url` request format. Limits image size and refuses unsupported MIME types; user-facing observations cannot assert a mechanical fault or pretend to hear audio.
- Added `server/contextEngine.js`: builds bounded user-authored symptom history, a first complaint, latest corrections, optional vehicle case history explicitly unverified, media-analysis flags and a retrieval query that incorporates recent relevant user details. It never upgrades earlier LLM guesses into confirmed problems.
- Integrated Context Engine into the main /api/chat source retrieval and Llama prompt; retained natural responses, Saudi terminology and stepwise sound questions.
- Updated `/api/model-status` to report **hosted chat and vision configuration** without querying Ollama; `/api/media-status` reports vision API configuration and FFmpeg readiness.
- Replaced obsolete setup instructions: `MULTIMODAL_SETUP.md`, `HOSTED_LLAMA_API_SETUP.md`, and added `LLAMA_CONTEXT_ENGINE_SETUP.md`.
- Added `tests/contextEngineVision.test.js` including no-Qwen active code, mock authenticated vision request, invalid media checks, corrections, context retention and unconfirmed prior case history.
- Existing installations must edit **the private local .env** in the real cloned project: remove duplicate old Qwen/Ollama entries, add `CHAT_API_KEY`, set `VISION_MODEL=meta-llama/llama-4-scout`, and restart server. No private key or installed local model was modified remotely.
- Live API success is **not confirmed** without the user's private API key. Provider costs and data processing apply.


### Phase 24 — Stop repetitive interviews and retrieve richer noise context (November 2, 2026)

- Root cause: chat previously had no enforced global question budget, and the audio interview required three questions regardless of information already known.
- Added `server/minimalQuestions.js`, a deterministic context-aware planner that reads user-authored information about sound **timing, texture and location**, avoids asking already-known details, stops asking once two dimensions are available, and limits clarification to at most one question per response and two questions during an ongoing issue. Safety-critical symptoms bypass the interview. Final response filtering suppresses extra model-generated questions without discarding explanation text.
- Updated the sound upload fallback to **two guided questions instead of three**; user answers are still user-supplied and not assumed to come from audio recognition.
- Added `data/conditional_noise_patterns_v1.json` with **30 curated, cited conditional noise patterns from 9 educational source URLs** including The AA, RepairPal, Firestone, Cars.com and Budget Mechanic YouTube, with never-confirmed flags. Integrated `server/conditionalNoiseRetrieval.js` to require at least two matching user-described features before offering a relevant hypothesis to the model. Existing 40 symptom cards, 28 YouTube topic references and 536 synthetic language examples remain; none are verified acoustic training samples.
- Added `tests/minimalQuestionsAndPatterns.test.js` and revised `tests/soundInterview.test.js` to guard against unnecessary repeated questions and test early completion.
- Added `MINIMAL_QUESTIONS_AND_EVIDENCE.md` with source links, test situations and limitations.
- Source-level JS syntax and isolated deterministic test cases were checked. Live Groq inference and comprehensive end-to-end tests on the user's laptop remain unverified; use `npm.cmd test` after pulling.

### Phase 3 continuation — unified evidence and verification

Preserve detailed written media descriptions alongside ASR, audio/video observations, vehicle/year corrections and unverified history. Add curated Saudi usage terms, shared media validation, measured upload percentages, unsent-draft preservation and narrow-layout containment. Final syntax checks, 156 Node tests and three mocked-provider Chromium suites passed. See [PHASE_3_REVIEW.md](PHASE_3_REVIEW.md). Stop here pending new recordings: no dataset ingestion, classifier implementation or training; suspected fault labels remain unverified and the requested 70% threshold stays disabled.

### Dictation separation and content-first attachment routing

The microphone now transcribes into an editable draft through a separate bounded ASR endpoint, without automatic chat, case creation or stored media. Explicit attachments retain the media-analysis path. Gemini attachment observations distinguish speech/mechanical/mixed/music/silence/other/uncertain and separately flag actual mechanical events; failed or unrelated clips no longer trigger automatic vehicle-location interviews. Existing written details and draft edits are preserved. Syntax checks, 160 Node tests and four mocked-provider browser suites passed. Live ASR/acoustic accuracy remains unverified without credentials and independent recordings. No ingestion, weights, training or threshold activation. See [dictation and content routing](DICTATION_AND_CONTENT_ROUTING.md).

### Compact reference-result cards and reuploaded-source audit

Both supplied MP4 hashes match the prior source inventory. All 15 existing reference windows decode to identical PCM; WAVs and original labels/timestamps remain unchanged. Added sampled visual-title review with explicit ambiguous-term and pending acoustic-review flags. New compact Arabic/English cards name only one clear, eligible tentative audio match, cite related inspection guidance and offer reference playback; unmatched, ambiguous, conflicting or failed comparisons do not force a component. Microphone dictation remains separate. Recognition metrics remain unavailable with zero independent test recordings; no training or threshold activation. See [SOUND_REFERENCE_RESULTS.md](SOUND_REFERENCE_RESULTS.md).

### Local identity for the four explicitly labeled uploads

Registered hashes and decoded PCM identities for the four actual supplied MP4s, without duplicating media. Exact matches return a known-recording card with the user's label and existing cited inspection guidance, before external inference. The path does not infer mechanical content or a confirmed fault; changed/new audio remains unmatched locally. Known-recording cards do not auto-request paid TTS. Microphone dictation remains separate. No model training or unvalidated threshold. See [KNOWN_RECORDINGS.md](KNOWN_RECORDINGS.md).

### Fix known original uploads when FFmpeg is unavailable

The reuploaded belt clip exactly matched the registered file hash. The prior PCM-only path reproduced the reported failure when FFmpeg was absent. Exact registered source-file identity now runs before decoder/temp/provider work, with method-bound proof and accurate file-identity wording. Decoded PCM identity remains an optional fallback. All four actual uploads passed the real browser flow with FFmpeg deliberately unavailable; 170 Node tests and syntax checks passed. No arbitrary new sound is labeled from its filename.
