# Warshatak — Meta Llama + Context Engine (November 2026)

The current Warshatak backend **does not use Qwen** for any active text or image inference. Both hosted models use the SAME private OpenRouter API key.

| Feature | Implementation |
|---|---|
| Text conversation, automotive knowledge, Saudi dialect | `meta-llama/llama-3.3-70b-instruct` (hosted) |
| Photos and sampled frames from video | `meta-llama/llama-4-scout` (hosted, vision) |
| Context Engine | `server/contextEngine.js` (local, deterministic assembly of user statements, corrections, vehicle history and retrieved knowledge) |
| Sound-event similarity | Optional local CLAP, needs Python/FFmpeg |
| Speech transcription | Optional local faster-whisper, needs Python |
| Audio waveform | Local FFmpeg (not sound recognition) |

## Configure

Open the real project directory `C:\Users\umaze\Documents\CarNoise-AI`, NOT a nested `CarNoise-AI-main` directory. Edit the private `.env` file; do not edit or delete `.env.example`.

```dotenv
PORT=3000
CHAT_API_URL=https://openrouter.ai/api/v1/chat/completions
CHAT_API_KEY=YOUR_PRIVATE_OPENROUTER_KEY
CHAT_MODEL=meta-llama/llama-3.3-70b-instruct
CHAT_MAX_TOKENS=450
VISION_MODEL=meta-llama/llama-4-scout
FFMPEG_PATH=ffmpeg
ENABLE_AUDIO_CLAP=1
AUDIO_PYTHON=python
CLAP_MODEL=laion/clap-htsat-unfused
ENABLE_SPEECH_TRANSCRIPTION=0
WHISPER_MODEL=base
```

The lines `CHAT_API_KEY` and `VISION_MODEL` are important. Remove duplicate `CHAT_MODEL` settings and older `qwen*`, `OLLAMA_HOST`, `LLAMA_API_URL`, and `LLAMA_MODEL` entries from your local `.env`. This project's text and vision paths no longer consult those older variables. You can keep the local Ollama program installed for unrelated projects; uninstalling it is optional.

**Provider and privacy:** OpenRouter processes the message text and any images sent to the vision API. The server sends a bounded context constructed from your current chat and your car's previous case descriptions; it does not send arbitrary files from your laptop. Audio still runs locally where FFmpeg/CLAP/Whisper are available, but *derived* media descriptions may enter the text conversation and be sent to OpenRouter. Do not upload sensitive personal information unnecessarily. Calls may have usage costs. A ChatGPT subscription does not include OpenRouter credits.

## Context Engine

`server/contextEngine.js` is NOT a new language model or fine-tuning run. It turns messages into a structured context:
- Original user-reported complaint and selected relevant user-authored updates
- Latest explicit correction, prioritized over conflicting older wording
- Previous vehicle cases marked **unverified**, never treated as mechanic-confirmed
- Media analysis status: what was/was not actually detected
- A bounded retrieval query joining recent relevant symptom details, so short replies like `زي الصرير` still find related automotive knowledge
- Constraints telling the model never to promote assistant guesses or CLAP similarities into verified facts

The engine does not scrape user data or silently store cross-account memory. The browser keeps each vehicle chat history as it already did, and the server assembles context from messages submitted with each request.

## Run

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Visit `http://localhost:3000/api/model-status`. You should see `chat.model` = `meta-llama/llama-3.3-70b-instruct`, `vision.model` = `meta-llama/llama-4-scout`, and `configured: true` for both. These checks show a key is configured, NOT that it works; try a real text response and a safe photo/video clip.

**Examples to test in one chat:**
1. `سيارتي ترج وهي واقفة`
2. `الرجفة تزيد مع المكيف`
3. `فيه صوت صرير بعد`
4. `لا قصدي الصوت من جهة الكفرات مو المكينة`
5. `وش قلت لك عن المشكلة؟`

The assistant should retain the idling complaint, add the AC/detail information, and defer to the correction without claiming a confirmed defective component.

## Official model documentation

- Llama 3.3 text: https://openrouter.ai/meta-llama/llama-3.3-70b-instruct/api
- Llama 4 Scout image: https://openrouter.ai/meta-llama/llama-4-scout/api
- API key: https://openrouter.ai/settings/keys
