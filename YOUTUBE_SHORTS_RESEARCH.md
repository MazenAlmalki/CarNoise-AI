# YouTube Shorts research and bilingual speech fallback

## Current research outcome — November 2, 2026

The requested search was **اصوات مشاكل سيارات** (with a Shorts qualifier), alongside English car-problem-sound searches. The cloud proxy refused the YouTube HTTPS connection with HTTP 403. No new Shorts could be opened or listened to: **0 new clips collected, 0 new soundtracks reviewed**. The saved environment network draft now includes YouTube/media hosts, but it has not been applied/published in the running instance. Existing custom network settings were preserved.

The access result is recorded in `data/research/youtube_shorts_research_status.json`. This is an audit report, not training data. Research can resume after the supported environment settings update. No proxy bypass, invented video IDs, unverified acoustic labels or manufactured collection counts were used.

## What changed independently

- The **existing 28 publisher-metadata reference entries** now have Arabic and English summaries. Arabic is an AI-authored paraphrase of the existing catalog, not a transcript or a new source/audio review. Original URLs, titles and all `actual_audio_verified:false` flags remain intact.
- `data/sound_topics_bilingual_v1.json` adds 20 bilingual vocabulary topics for source retrieval, including Saudi descriptions such as `الفرامل تصفر`, `طقطقة السلف` and `رمان بلي`. These are curated search terms, not diagnoses extracted from new recordings.
- Runtime reference lookup accepts Arabic/English variants and presents localized titles/summaries. References remain optional educational context; they do not establish an acoustic match to a user's clip.

## Reusable public Shorts discovery

On a machine with authorized YouTube access, from the project root:

```powershell
node scripts/collect_youtube_shorts.js --limit 12 --output data/research/youtube_shorts_candidates.json
```

No API key is needed for public-page metadata discovery. It searches both requested languages, extracts explicit Shorts endpoints, deduplicates IDs, and checks public player metadata and duration (up to 180 seconds). Sign-in/consent restrictions or page-format changes may prevent collection. The script does not bypass them. Existing output files are never overwritten; choose another output path to preserve existing reviews. In a Node 24 cloud environment with HTTP proxies, enable environment proxy support as documented for the environment.

**Discovery is not video/audio review.** Candidate records intentionally leave `bilingual_summary.ar/en` and observation fields empty, with `audio_reviewed:false`, `video_reviewed:false`, `mechanical_fault_confirmed:false`, unknown licensing and `eligible_for_runtime:false`. They are not automatically added to the live reference catalog.

Before admitting a new clip, review its actual content and record:

1. Original URL, channel, title, duration, date checked and how it was reviewed.
2. Separately: what can be heard, what can be seen, what the uploader claims, and any independent confirmation.
3. A concise paraphrased summary in Arabic and English, relevant timing/context, and limitations.
4. Rights/license status before storing, redistributing or training on the actual audio. A public link alone is not permission to republish its recording or full transcript.

Do not turn titles, inferred symptoms, metadata-only clips or synthetic phrases into “verified recordings” or confirmed faults. No model weights were trained by this change.

## Speech-to-text when sound interpretation is unavailable

Set in your existing private `.env`:

```dotenv
SPEECH_FALLBACK=auto
SPEECH_LANGUAGE=auto
GROQ_SPEECH_MODEL=whisper-large-v3-turbo
```

`auto` reuses a dedicated `GROQ_API_KEY` if present, or the existing `CHAT_API_KEY` **only when** `CHAT_API_URL` securely points to `api.groq.com`. It never forwards an OpenRouter/Gemini key to Groq. Otherwise it uses local Whisper when `ENABLE_SPEECH_TRANSCRIPTION=1`, or reports that no fallback is configured. Do not replace your working chat configuration or post keys in chat.

Gemini's own intelligible transcript is preferred. When no intelligible transcript or clear hosted sound event is available, the independent fallback can still transcribe speech even if Gemini's sound analysis fails. For video it uses the audio track. Groq receives the bounded WAV excerpt through its speech-transcription endpoint; provider quotas, costs and data-handling terms apply. Set `SPEECH_FALLBACK=none` to disable fallback, `groq` to select it explicitly, or `local` with Whisper enabled for local operation.

Transcription preserves the original words/language; it is not translation into English and not a sound/fault classifier. Arabic/English detection does not depend on the interface language. Uncertain/no-speech segments are filtered; silence does not become an invented message. A clear non-speech sound does not trigger an unnecessary second ASR request. Recognition can still be wrong, so confirm important phrases.

The attachment card displays recognized words in either UI language, with a **Correct or clarify** action that copies the transcript into the composer for user editing. Nothing uploads before Send. Failed sound recognition and successful speech recognition have separate status fields, and recognized speech reaches chat instead of being replaced with the manual noise interview.

Local Whisper requires its existing optional Python environment. No Python model was downloaded or live hosted transcription verified in this task; tests used controlled provider responses and actual FFmpeg audio extraction.

## Focused Saudi-market scope

The continuing request narrows research to a compact initial set of 18 models and prioritizes evidence-supported answers over repeated questions. Existing 40 symptom cards and 30 conditional patterns are shared across vehicles, with Arabic/English content. This does not create model-specific defects or a verified popularity ranking; manufacturer/source collection remains blocked. See [SAUDI_VEHICLE_EVIDENCE.md](SAUDI_VEHICLE_EVIDENCE.md).

## Validation

Run `npm.cmd run check` and `npm.cmd test`. New tests cover bilingual retrieval, source provenance, fixture-only Shorts discovery, blocked access, safe credential reuse, original-language transcripts, silence filtering, real audio normalization, Gemini-failure/Groq-speech recovery, and the chat route using recognized speech. The known baseline source-string assertion in `tests/carAudioCatalog.test.js:32` remains separate.

## User-selected playlist

The user later selected this exact source:

https://www.youtube.com/watch?v=ciVOqe7ji2Q&list=PLAfTiqc9y29huuPbBepZyvRS4OPpzkSLw

Access to that URL also returned HTTP 403. `data/research/requested_audio_playlist.json` records the user-provided playlist ID and seed video, with zero clips reviewed and no claim that playlist membership was verified. No title, audio label or diagnosis was fabricated from the link.

A public initial-page metadata inventory can be prepared on a machine with authorized YouTube access:

```powershell
node scripts/collect_youtube_playlist.js --url "https://www.youtube.com/watch?v=ciVOqe7ji2Q&list=PLAfTiqc9y29huuPbBepZyvRS4OPpzkSLw" --output data/research/requested_playlist_candidates.json
```

This is **not** a complete playlist download or audio analysis. Pagination/continuation and unavailable clips can make an initial-page inventory partial; `inventory_complete` remains false. Each candidate keeps separate Arabic/English summary fields, audio-review flags and runtime eligibility pending. Before using the actual recordings for recognition/reference matching, each accessible clip must be listened to/analyzed, its audible features separated from uploader claims, and rights to store/use its audio checked. Merely cataloging URLs does not train the model or establish that it recognizes those recordings.
