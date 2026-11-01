# CarNoise AI — وش صوت السيارة؟

An Arabic/English vehicle-noise assistant with a responsive dashboard, light/dark themes, vehicle folders and history, and optional local audio/video attachments.

## Features
- Arabic / English user interface and Llama output (language setting preserved locally)
- Dark / light theme (saved locally)
- Multiple vehicles and a separate history for each
- Previous five analyzed issues for the selected vehicle are passed to Llama as **unconfirmed context** on the next analysis
- Four guided questions, possible causes, urgency, safety guidance
- Audio/video file uploads and microphone recordings, with local playback

**Current audio limitation:** attachments are saved locally in IndexedDB, not sent to Llama. The default Meta Llama 3.2 model is text-only and **cannot recognize recorded vehicle sounds**. Uploaded media is for playback and reference, not automatic audio diagnosis. A separate audio model/processing pipeline is required to classify actual recordings. See `AUDIO_INTEGRATION_PLAN.md`.

## Free Llama on Windows

1. Install [Ollama](https://ollama.com/download).
2. Run:
   ```powershell
   ollama pull llama3.2:3b
   ```
3. From the CarNoise-AI folder:
   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```
4. Open http://localhost:3000

The backend defaults to `http://127.0.0.1:11434/v1/chat/completions` with the `llama3.2:3b` model and no API key. Ollama must be running locally.

For a cloud provider create your own `.env` using `.env.example` and set `LLAMA_API_URL`, `LLAMA_API_KEY`, and `LLAMA_MODEL`. Never commit secrets. A deployed backend cannot access Ollama on a user's own laptop through localhost.

## Data and privacy

Vehicle names, issues, and AI result summaries are stored in **this browser's localStorage**; attached media is saved in **this browser's IndexedDB**. This is **not a cloud account** and data will not sync across devices. Browser clearing, storage limits, or private browsing may erase it. Descriptions, guided answers and up to five summaries of previous issues for the active car are transmitted to your configured Llama endpoint for analysis. Audio/video files are not uploaded to the backend. Choose a provider you trust and avoid putting personal identifying information in descriptions.

## API

`GET /api/health`: reports backend setup (not actual Ollama readiness).

`POST /api/analyze`: JSON with `description`, Arabic canonical values for `timing`, `sound`, `location`, `frequency`, optional `language: 'ar'|'en'` and optional `history` (past case snippets). Returns `result` with `title`, `summary`, `severity` (`low`, `medium`, `high`), `reasons`, `nextSteps`, and `urgentSigns`.

## Status

- [x] Bilingual responsive frontend and theme toggle
- [x] Multi-car browser-local history and media playback
- [x] Backend with validation, free local Ollama adapter and past issue context
- [ ] Test all workflows against an installed Ollama model and different browsers
- [ ] Implement specialist audio/video classification model
- [ ] Deploy to a public host with accessible AI endpoint
