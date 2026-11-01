# CarNoise AI — وش صوت السيارة؟

Arabic-first, responsive web app for exploring **possible** causes of unusual car noises. It asks four guided questions and requests an analysis from Meta Llama. Results are not confirmed diagnoses.

## Free local Meta Llama (no API key)

1. Install Ollama for Windows from https://ollama.com/download.
2. Open PowerShell and download the model once:

   ```powershell
   ollama pull llama3.2:3b
   ```

3. Keep Ollama running. Then in the project folder:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

4. Open http://localhost:3000 and complete all four questions. The app talks to Ollama at `http://127.0.0.1:11434/v1/chat/completions`.

**No API key is needed for local Ollama.** The default model is `llama3.2:3b` (~2 GB download). The smaller `llama3.2:1b` model (~1.3 GB) can be selected with `LLAMA_MODEL=llama3.2:1b` in a local `.env` file after downloading it, but its quality may be lower. Arabic output and structured JSON are not guaranteed; test carefully.

## Optional cloud Llama

Copy `.env.example` to `.env`. Set `LLAMA_API_URL`, `LLAMA_API_KEY` and `LLAMA_MODEL` to your authorized provider's values. Do not commit `.env` or share API keys.

## Stack and API

- Node.js 20+, Express, HTML, CSS, JavaScript
- Local Meta Llama 3.2 through Ollama (or compatible cloud provider)
- `GET /api/health` reports backend configuration, **not** actual Ollama availability.
- `POST /api/analyze`: JSON body with `description`, `timing`, `sound`, `location`, `frequency`; returns `result` with `severity`, `reasons`, `nextSteps`, and `urgentSigns`.

## Project status
- [x] Guided responsive Arabic UI
- [x] Express API with validation, rate limits, errors and timeouts
- [x] Default local Ollama adapter, no API key
- [ ] Test against user's actual local Ollama installation
- [ ] Deploy to a server with its own accessible Llama service for public use

**Important:** A public hosted backend cannot call your laptop's `localhost`. For a deployed production app, configure a reachable hosted Ollama service or a cloud Meta Llama provider.

See `OPENCODE_TASK.md` for testing and deployment tasks.
