# References & Data Sources — Warshatak (ورشتك)

**Last updated:** November 1, 2026  
**Repository:** https://github.com/MazenAlmalki/CarNoise-AI

This file records the external sources *referenced and cataloged* for Warshatak. A referenced dataset is **not necessarily downloaded, licensed for redistribution, integrated into the app, or independently validated**. License and publication details must be rechecked on the original provider page before using its audio.

## 1. Automotive knowledge and technical explanations

| Source | URL | Use in project | Verification status |
|---|---|---|---|
| AAA — car noises you shouldn't ignore | https://www.acg.aaa.com/connect/blogs/4c/auto/car-noises-you-shouldnt-ignore | Noise/symptom explanations and safe actions | Publisher guidance; not a confirmed vehicle diagnosis |
| AAA Auto Repair — common car problems | https://www.aaa.com/autorepair/articles/13-common-car-problems-explained | Brake symptoms and repair guidance | Publisher guidance |
| AAA Club Alliance — vehicle noises | https://cluballiance.aaa.com/the-extra-mile/advice/car/vehicle-noises-you-should-never-ignore | Unusual noise reference descriptions | Publisher guidance |
| AAA Club Alliance — strange sounds/smells | https://cluballiance.aaa.com/the-extra-mile/advice/car/what-does-that-strange-car-smell-or-weird-noise-mean | Symptoms and possible causes | Publisher guidance |
| AAA — tire safety | https://ace.aaa.com/automotive/advocacy/tire-safety.html | Tire/road noise context | Publisher guidance |
| The AA — unusual car noises | https://www.theaa.com/car-care/advice/servicing/guide-to-unusual-car-noises | Noise categories and when to inspect | Publisher guidance |
| U.S. Federal Trade Commission — Auto Repair Basics | https://consumer.ftc.gov/articles/0211-auto-repair-basics | General repair warning signs | Government consumer guidance |

**Stored in:** `data/knowledge_seed_v1.json` (14 bilingual knowledge cards) and `data/source_comments_v1.json` (12 *paraphrased publisher guidance notes*). These are not comments by verified mechanics on the individual audio clips, and they are not proof of a specific mechanical failure.

## 2. Individual audio reference pages

The repository holds **12 linked sound-page records**, not the recordings themselves. The original URL, author, stated license, and recording metadata are in `data/audio_sources_v1.json`.

| ID | Recording / type | Publisher/creator | Original page | Cataloged license |
|---|---|---|---|---|
| S001 | Car starting | Freesound / prometheus888 | https://freesound.org/people/prometheus888/sounds/458461/ | CC0 |
| S002 | Engine idle | Freesound / XiiiSamples | https://freesound.org/people/XiiiSamples/sounds/384107/ | CC0 |
| S003 | Engine starting/stopping | Freesound / justamudkip | https://freesound.org/people/justamudkip/sounds/840871/ | CC0 |
| S004 | Squeaky brakes (archival sound) | Freesound / craigsmith | https://freesound.org/people/craigsmith/sounds/481702/ | CC0 |
| S005 | Brake screech/squeak | Freesound / WavJunction.com | https://freesound.org/people/WavJunction.com/sounds/456764/ | CC0 |
| S006 | School-bus brake squeal | Freesound / timpet55 | https://freesound.org/people/timpet55/sounds/706273/ | CC0 |
| S007 | Braking noise | Freesound / ronikn | https://freesound.org/people/ronikn/sounds/770642/ | CC0 |
| S008 | Tire squeal | Freesound / JeffPearson | https://freesound.org/people/JeffPearson/sounds/850041/ | CC0 |
| S009 | Older car startup / drive off | Freesound / CHallSmith | https://freesound.org/people/CHallSmith/sounds/870858/ | CC0 |
| S010 | Parking-lot engine sound | Freesound / ptp8ss | https://freesound.org/people/ptp8ss/sounds/346857/ | CC0 |
| S011 | Starting a car and driving | Wikimedia Commons / stephan | https://commons.wikimedia.org/wiki/File:Starting_a_car_and_driving.ogg | Public domain (as cataloged) |
| S012 | Opel Corsa engine startup | Wikimedia Commons / MKFI | https://commons.wikimedia.org/wiki/File:Open_Corsa_E_model_2014_engine_startup_sound.ogg | Public domain (as cataloged) |

**Caution:** Clip descriptions and sound-effect labels are not mechanic-verified fault labels. Before redistribution, check that the license shown on the live source is still correct, and keep authorship/provenance.

## 3. Large audio datasets researched (not imported into the app)

| Dataset | Original URL | Publisher-reported size | Characteristics and access |
|---|---|---:|---|
| KweriMoto Engine Sounds | https://huggingface.co/datasets/rayyyyy007/kwerimoto-engine-sounds | 1,067 clips | Real and synthetic / mixed provenance; labels and vehicle identity may be unverified; third-party rights need auditing. |
| Procedural Engine Sounds | https://huggingface.co/datasets/rdoerfler/procedural-engine-sounds | 5,935 clips | Synthetic engine operations; CC BY-NC 4.0, **noncommercial**; not diagnosed faults. |
| Sounds of Vehicle Internal Combustion Engines | https://zenodo.org/records/18777405 | 475 clips | Real vehicle operating sound recordings; no confirmed fault labels; verify reuse rights. |
| OtoMobile | https://zenodo.org/records/3382945 | 65 clips | Research dataset with mechanic-provided/consulted diagnostic context; **restricted access**, permission required. |
| Google AudioSet | https://research.google.com/audioset/ | 2,084,320 annotated clips (overall dataset, **not** 2M car clips) | Broad audio event data, many from YouTube; not automotive fault diagnoses; YouTube recording rights differ from metadata permissions. |

**Counts are publisher-reported, not counts of audio files held in this repository.** Do not add them together as a verified set of unique, usable car-fault examples.

## 4. Software and technical references

| Tool / technology | Official reference | Actual project role |
|---|---|---|
| Meta Llama 3.2 | https://www.llama.com/ | Text generation model used via a local API integration |
| Ollama | https://ollama.com/ | Local model runner and HTTP API adapter |
| Ollama API | https://docs.ollama.com/api | Local Llama chat completion endpoint |
| Node.js | https://nodejs.org/ | JavaScript backend runtime |
| Express | https://expressjs.com/ | HTTP routes and static-site hosting |
| Git and GitHub | https://git-scm.com/ / https://github.com/ | Version control and source repository |
| VS Code | https://code.visualstudio.com/ | Local code editing and terminal |
| Web Storage / IndexedDB | https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API | Browser-local vehicle histories and media storage |
| MediaRecorder API | https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder | Browser microphone recording |
| Python | https://www.python.org/ | Dataset metadata importer (standard library) |

**Researched/planned, not implemented:** CLAP audio embeddings, FAISS similarity search, RAG retrieval, and LoRA/QLoRA fine-tuning; potential experimentation with Unsloth / Google Colab. Do not list these as completed or used in the running application unless implementation and testing are added.

## 5. Data inventory and citations inside the repository

| File | What it actually contains |
|---|---|
| `data/knowledge_seed_v1.json` | 14 bilingual, source-grounded *possible cause* knowledge cards |
| `data/training_candidates_unreviewed.jsonl` | 14 generated candidate training conversations; **not expert reviewed** |
| `data/source_comments_v1.json` | 12 publisher-guidance summaries, paraphrased |
| `data/audio_sources_v1.json` | 12 individual audio **source links and metadata**, not the audio |
| `data/audio_dataset_catalog_v1.json` | Four dataset leads with access/licensing notes |
| `data/large_audio_dataset_catalog.json` | Five larger dataset records with reported sizes and caveats |
| `data/cases_template.csv` | Blank template for real, independently checked repair cases |
| `scripts/import_kwerimoto.py` | Code to fetch and validate publisher metadata; not an audio downloader |

For deeper collection notes, see `data/AUDIO_SOURCES_README.md`, `data/LARGE_AUDIO_COLLECTION.md`, and `DATA_COLLECTION_GUIDE.md`.

## 6. Academic reporting cautions

- Differentiate **source-reviewed explanations**, **research labels**, **synthetic recordings**, and **mechanic-confirmed service diagnoses**.
- Respect individual dataset licenses, access restrictions, privacy, and reuse rights.
- Never claim that uploading audio currently produces a recognized mechanical fault. It does not.
- Cite the original publisher page and author for each reused asset; review source accuracy and licensing again before final submission.


## 7. Added typed-symptom source coverage (November 1, 2026)

`data/typed_symptoms_v1.json` contains 40 bilingual, source-linked cards for users who **type a problem description**. Cards are paraphrases and suggestions, not verified diagnoses or actual repair outcomes.

Additional publisher pages:
- AAA — tune-up warning signs: https://mwg.aaa.com/automotive/auto-repair/articles/car-tune-up-warning-signs-checklist
- AAA — car will not start: https://ww1.aaa.com/autorepair/articles/14-reasons-why-your-car-wont-start
- AAA — maintenance warning signs: https://exchange.aaa.com/adulting-with-aaa/car-care/the-what-when-and-why-of-car-maintenance/
- AAA — recognizing common mechanical problems: https://ace.aaa.com/automotive/advocacy/recognize-symptoms-most-common-car-mechanical-problems.html
- AAA Club Alliance — warning signs: https://cluballiance.aaa.com/the-extra-mile/advice/car/car-warning-signs-you-should-never-ignore
- RAC — unusual vehicle noises: https://www.rac.co.uk/drive/advice/know-how/guide-to-unusual-vehicle-noises/
- Earlier cited **U.S. FTC Auto Repair Basics** and **The AA** unusual car noises guide were also used.

Actual implementation: `server/textRetrieval.js` performs keyword and phrase lookup, and `server/index.js` includes the retrieved content and URLs in the local Llama prompt. **CLAP, vector embeddings, FAISS, and fine-tuning are not involved in typed-text retrieval.** Nothing here has been reviewed as a confirmed mechanic service diagnosis.


## 8. Multimodal models and runtime dependencies (November 2026)

| Technology | Official source | Use in Warshatak V5 | Deployment status |
|---|---|---|---|
| Qwen3.5, 2B | https://ollama.com/library/qwen3.5 | Modern compact text model for natural automotive chat; independent local Ollama download needed | Integrated by model name; local runtime unverified |
| Qwen3-VL, 2B | https://ollama.com/library/qwen3-vl | Image and extracted video frame descriptions, not sound | Integrated by model name; local runtime unverified |
| CLAP / LAION | https://huggingface.co/docs/transformers/model_doc/clap | Zero-shot audio-to-text similarity through a separate Python process | Optional model written, OFF by default and not validated |
| FFmpeg | https://ffmpeg.org/ | Extract up to two image frames and audio from uploaded video | User must install separately |
| PyTorch | https://pytorch.org/get-started/locally/ | Run CLAP locally in Python | Optional, not installed for user here |
| Hugging Face Transformers | https://huggingface.co/docs/transformers/index | CLAP implementation and processor | Optional, not installed for user here |
| Multer | https://github.com/expressjs/multer | Multipart request upload to Node backend | Dependency added to package.json |

**Sources are official vendor/project documentation.** Model capabilities vary by available build and hardware. Upgrading the app's model configuration is not equivalent to proving higher-quality diagnosis, and video/audio similarity is not a professional automotive inspection.


## 9. Saudi official context and large dialect corpus (November 2, 2026)

| Source | Original link | Relevant research use |
|---|---|---|
| Saudi Ministry of Commerce — defective products/vehicle recalls lookup | https://mc.gov.sa/ar/eservices/Pages/ServiceDetails.aspx?sid=30 | Official recall lookup; **verify by VIN rather than model name alone** |
| Saudi Civil Defense — fire safety inside cars during hot weather (June 2026) | https://998.gov.sa/Main/Page/News/2751/ | Official heat-related vehicle safety precautions, not fault-diagnosis data |
| Saudi Ministry of Commerce — tire labeling and conformity checks | https://mc.gov.sa/en/mediacenter/News/Pages/18-04-23-01.aspx | National tire labeling/manufacturing-date and product safety context |
| Saudi Ministry of Commerce — specific Toyota/Lexus parking assistance recall (April 2026) | https://mc.gov.sa/ar/mediacenter/News/Pages/13-04-26-01.aspx | A limited recall example, **not a blanket Toyota or Lexus failure claim** |
| Saudi Ministry of Commerce — selected Nissan Altima / Infiniti engine recall (September 2025) | https://mc.gov.sa/en/mediacenter/News/Pages/03-09-25-01.aspx | Official campaign details; VIN verification required |
| Saudi Press Agency — Nissan Magnite brake recall (September 2025) | https://www.spa.gov.sa/en/N2395778 | Selected official recall report |
| Saudi Press Agency — Nissan Patrol transmission control recall (September 2025) | https://www.spa.gov.sa/en/N2389233 | Selected official recall report |

See `data/saudi_official_context_v1.json` for paraphrases and per-record source URLs. The 1,200 Saudi user-utterance examples are **synthetically generated** from existing source card titles and aliases; they have no claim of independent external collection, real owner experiences, or mechanic confirmation. The 124 additional colloquial aliases are author-created language examples. The underlying 40 card references are in `data/typed_symptoms_v1.json`.

**Data licensing and verification:** Original publishers retain their own rights. Descriptions are newly authored paraphrases, not copied user reviews. The system does not store or expose real users' VIN, names, plates or personal information in this research corpus.


## 10. Authored Saudi colloquial language and unusual-message examples (November 2, 2026)

- `data/saudi_dialect_glossary_v1.json`: **128 author-curated examples**, including explanatory translations of Saudi everyday and automotive terminology. Not a third-party collected language corpus or published dictionary.
- `data/saudi_conversation_edge_cases_v1.jsonl`: **204 synthetically authored variants** representing 51 user-intent scenarios. They are used for reasoning-prompt design and tests, **not mechanical fault evidence**.
- `server/saudiDialect.js`: lightweight local matching, ambiguity flags and conversation-intent hints for the LLM.
- `SAUDI_DIALECT_GUIDE.md`: project-specific descriptions and validation limitations.

These authored linguistic examples have **no external source URL** because they are generated for this project. They must not be cited as real mechanic comments, independently observed user conversations or verified real-world vehicle cases. Original sources for automotive information remain in sections above.


## 11. Saudi automotive terminology and English language reliability (November 2, 2026)

- Motory Saudi: parking/hand brake, **جلنط** — https://ksa.motory.com/ar/الاخبار/جلنط-هاند-بريك-سيارة/
- StriveME: brakes terminology including **جلنط**, brake pads and rotors — https://striveme.com/article/محركات/أخبار/إليك-معنى-فحمات-السيارة-وهوبات-السيارة-وقماشات-السيارة-وتيل-الفرامل-وجلنط
- Saudi owners' community terminology list (contextual, not technical certification): **بوري** as horn and **جلنط** as parking brake — https://montada.haraj.com.sa/58319/
- RAC general dashboard warning-light guidance — https://www.rac.co.uk/drive/advice/know-how/car-dashboard-warning-lights-meaning/

The 89 entries and 317 variants in `data/saudi_car_terms_v1.json` contain **author-created translations and examples**; these publications inform selected entries but do not independently verify all synonyms. The 1,068 paired dialogue examples are generated and are **not** real user logs, diagnosed repairs, or model fine-tuning. Source and limitations: `SAUDI_CAR_TERMS_AND_ENGLISH.md`.
