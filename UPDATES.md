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
