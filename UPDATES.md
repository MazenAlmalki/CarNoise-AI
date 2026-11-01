# Development Log — ورشتك | Warshatak

**Updated:** November 1, 2026  
**GitHub repository:** https://github.com/MazenAlmalki/CarNoise-AI  
**Repository name:** `CarNoise-AI`; **application name:** `ورشتك / Warshatak`

This log documents the work visible in our development conversation and GitHub repository. It distinguishes **implemented in source**, **locally reported working**, and **not yet implemented/tested**. It is a retrospective summary, not a claim that every feature has been fully tested in production.

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
