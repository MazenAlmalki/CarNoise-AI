# Warshatak — Media Setup (Meta Llama APIs + Optional Audio Models)

**Current version: November 2026.** Text conversations use **Meta Llama 3.3 70B** through OpenRouter. Image and sampled video frames use **Meta Llama 4 Scout** through the SAME OpenRouter key. The project does not use local Qwen or Ollama for text or vision.

## Required environment variables

```dotenv
CHAT_API_URL=https://openrouter.ai/api/v1/chat/completions
CHAT_API_KEY=YOUR_PRIVATE_OPENROUTER_KEY
CHAT_MODEL=meta-llama/llama-3.3-70b-instruct
VISION_MODEL=meta-llama/llama-4-scout
FFMPEG_PATH=ffmpeg
ENABLE_AUDIO_CLAP=0
AUDIO_PYTHON=python
CLAP_MODEL=laion/clap-htsat-unfused
ENABLE_SPEECH_TRANSCRIPTION=0
WHISPER_MODEL=base
```

Never commit the private `.env`. The same OpenRouter account/key must have access to both models; calls may be billed. Main chat and image/frame context are sent to the remote provider.

## Which parts process each media type?

| Attachment | Active processing |
|---|---|
| Images (`.jpg`, `.png`, `.webp`) | Hosted Meta Llama 4 Scout vision via OpenRouter |
| Video (`.mp4`, `.webm`, `.mov`) | Local FFmpeg extracts frames at 0s and 2s; Llama 4 Scout describes the still frames, optionally audio waveform/CLAP/Whisper |
| Audio (`.webm`, `.wav`, `.mp3`, etc.) | Local FFmpeg extracts basic waveform characteristics. Optional local CLAP compares candidate sound labels; optional local faster-whisper transcribes words |
| Text chat | Hosted Meta Llama 3.3 70B with the Warshatak Context Engine and automotive references |

**Limits:** Image/frames cannot hear sounds; FFmpeg waveform metrics cannot recognize a squeal or car part; CLAP gives uncalibrated sound similarity, not confirmed mechanical fault; Whisper can mishear words. Video only samples two still frames. Files are temporarily processed server-side and local browser history may keep the attachment.

## Windows prerequisites

Install FFmpeg if missing:
```powershell
winget install --id Gyan.FFmpeg -e --source winget
ffmpeg -version
```

Restart VS Code and server after FFmpeg installation so its PATH refreshes.

For OPTIONAL CLAP sound classification, use a compatible Python environment and install:
```powershell
python --version
python -m pip install numpy torch transformers
```
Then set `ENABLE_AUDIO_CLAP=1`, save `.env`, restart. First use downloads CLAP model weights. CLAP + the large local models can strain an 8GB Windows laptop; an API chat/vision model offloads those tasks but CLAP still runs locally.

For OPTIONAL speech-to-text:
```powershell
python -m pip install faster-whisper
```
Then set `ENABLE_SPEECH_TRANSCRIPTION=1`. The first use downloads Whisper model weights; the default base model can have accuracy issues with Saudi Arabic.

## Verify readiness

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

- `http://localhost:3000/api/model-status` — shows hosted text and vision API **configuration**, but no authenticated model request.
- `http://localhost:3000/api/media-status` — `ffmpegReady` confirms FFmpeg is available for video frames and waveform analysis.
- Test one text chat, one image, and one short audio clip. If audio is unidentified, the guided sound interview asks user for the source/conditions/description and NEVER claims that answers came from audio recognition.

See [LLAMA_CONTEXT_ENGINE_SETUP.md](LLAMA_CONTEXT_ENGINE_SETUP.md) and [SOUND_RESEARCH_AND_GUIDED_QUESTIONS.md](SOUND_RESEARCH_AND_GUIDED_QUESTIONS.md).
