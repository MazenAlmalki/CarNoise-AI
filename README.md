# CarNoise AI — وش صوت السيارة؟

Saudi-focused Arabic RTL web app that asks drivers about unusual car noises, then uses Meta Llama to suggest **possible explanations**, urgency and appropriate next steps — not a confirmed mechanical diagnosis.

## Technology
- Frontend: responsive HTML, CSS, vanilla JavaScript
- Backend: Node.js 20+, Express
- AI: Meta Llama via configurable OpenAI-compatible chat completion API

## Get started
```bash
npm install
cp .env.example .env
npm run dev
```
On PowerShell, use `Copy-Item .env.example .env`.
Open http://localhost:3000

Populate `LLAMA_API_URL`, `LLAMA_API_KEY`, `LLAMA_MODEL` inside `.env`. Do not commit keys.

## API
- `GET /api/health`
- `POST /api/analyze`: JSON with `description`, `timing`, `sound`, `location`, `frequency`.
- Response: `{ "result": { "title":"...", "summary":"...", "severity":"low|medium|high", "reasons":[{"title":"...", "explanation":"..."}], "nextSteps":["..."], "urgentSigns":["..."] }, "poweredBy":"Llama" }`.

The guided UI works before Llama configuration, but actual analysis requires the real provider. The app reports a configuration error rather than showing fabricated analysis.

## Status
- [x] Responsive Arabic chat interface and guided questions
- [x] API, input validation, loading/errors, Llama adapter
- [ ] Verify real Llama model with OpenCode
- [ ] Deploy publicly and test end-to-end

Follow `OPENCODE_TASK.md` for the next steps.