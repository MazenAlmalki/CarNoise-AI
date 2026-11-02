# Warshatak — Meta Llama via hosted API

The main conversational model and the legacy text-analysis endpoint now use **Meta Llama 3.3 70B Instruct** through OpenRouter's OpenAI-compatible API, instead of local Qwen.

## 1. Configure your private `.env`

In `C:\Users\umaze\Documents\CarNoise-AI\.env`, remove duplicated old `CHAT_MODEL`, `LLAMA_API_URL` and `LLAMA_MODEL` values, and keep one line each for:

```dotenv
CHAT_API_URL=https://openrouter.ai/api/v1/chat/completions
CHAT_API_KEY=YOUR_OPENROUTER_KEY
CHAT_MODEL=meta-llama/llama-3.3-70b-instruct
CHAT_MAX_TOKENS=450
```

**You must create your own key** at https://openrouter.ai/settings/keys . Never share it in chat, commit it to GitHub or put it in frontend JavaScript. `.env.example` is a checked-in blank template; `.env` is private. OpenRouter requests may require paid API credits; ChatGPT subscriptions are **not** API credits. Keys, limits, rates and available models may change. For the current model listing see https://openrouter.ai/meta-llama/llama-3.3-70b-instruct/api .

**Do not change Ollama's local vision settings to Llama text API credentials:** `VISION_MODEL=qwen3-vl:2b` is a **separate image and sampled-video-frame analyzer** still running locally on Ollama. This change replaces the **text conversation and legacy analysis only**, not Qwen-VL visual analysis, Whisper speech recognition or CLAP acoustic similarity.

## 2. Run

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Visit `http://localhost:3000/api/model-status`: `chat.provider` should be `openrouter.ai`, `chat.model` should be `meta-llama/llama-3.3-70b-instruct`, and `chat.configured` should be `true`. This means **configured**, not that your key is valid or a request succeeded. Then open `http://localhost:3000` and send `سيارتي ترج وهي واقفة` and follow up with another sentence in the same thread.

## Key troubleshooting

- 503 about `CHAT_API_KEY`: key missing in the actual `.env`; restart the server after editing.
- 401: invalid or expired API key.
- 402: provider may require sufficient credits.
- 429: API rate limit reached.
- 502: network/provider/model issue; inspect server console. The backend does **not** log or return the key itself.
- This switch may improve responsiveness versus CPU-only text chat, but requires an internet connection, incurs provider data processing and may incur API usage costs. Text prompts and chat context are sent to the configured provider; recordings are not sent directly to this text-only model, but any derived media insights put in the prompt may be sent.

## Hosting note

Default `CHAT_API_URL` points to OpenRouter. Another OpenAI-compatible API can be selected if it hosts a Meta Llama model: set `CHAT_API_URL`, `CHAT_MODEL`, `CHAT_API_KEY` accordingly. The endpoint must be HTTPS unless explicitly using localhost.
