# Warshatak — Hosted Meta Llama API

**Current provider:** OpenRouter with Meta Llama 3.3 70B Instruct (chat) and Meta Llama 4 Scout (image/video frames). There is no active local Qwen dependency.

Open your private `C:\Users\umaze\Documents\CarNoise-AI\.env` and use these lines exactly once:

```dotenv
CHAT_API_URL=https://openrouter.ai/api/v1/chat/completions
CHAT_API_KEY=YOUR_OPENROUTER_API_KEY
CHAT_MODEL=meta-llama/llama-3.3-70b-instruct
CHAT_MAX_TOKENS=450
VISION_MODEL=meta-llama/llama-4-scout
```

Keep the audio-related lines if using FFmpeg, optional CLAP or Whisper; see [MULTIMODAL_SETUP.md](MULTIMODAL_SETUP.md).

Create a key: https://openrouter.ai/settings/keys . Keep it private. API requests can cost credits; ChatGPT subscriptions do not include OpenRouter API credits. OpenRouter will receive chat text, retrieved context and any images sent to the Llama Scout vision model. Do not include sensitive personal information in uploads.

Start:
```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Visit `http://localhost:3000/api/model-status` to confirm the expected models are configured. A true configuration status does NOT verify the key, credits or API availability; test with a real message and photo.

Troubleshooting: 503 missing key; 401 invalid key; 402 insufficient credits; 429 rate-limited; 502 model/provider/network error. Use server logs, never paste the full key into chat.

[Context Engine and all setup details](LLAMA_CONTEXT_ENGINE_SETUP.md).
