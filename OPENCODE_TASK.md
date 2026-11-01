# OpenCode follow-up — CarNoise AI V2

The GitHub repository now contains a responsive bilingual (Arabic/English), dark/light UI, vehicle folders, local history, microphone recording, audio/video attachments, and a local Meta Llama 3.2 backend.

1. Read README.md, AUDIO_INTEGRATION_PLAN.md, public/index.html, public/styles.css, public/app.js, and server/index.js.
2. Run npm install, npm run check, npm run dev and test in a real browser at desktop/mobile sizes.
3. Validate both languages, themes, car creation, car selection, history, retention after reload and local media playback.
4. Connect and test with the user's actual local Ollama installation. Report any malformed JSON or resource constraints.
5. IMPORTANT: Audio/video recordings are NOT analyzed by Llama 3.2 text-only. Do not claim they are; implementing real recognition requires a separate classifier, per AUDIO_INTEGRATION_PLAN.md.
6. Verify English model output and that history is never treated as confirmed diagnoses. Review safety wording for brake/steering/smoke issues.
7. Do not leak API keys, upload media without consent, or change unrelated repositories.
8. Request approval before pushing extra commits or deploying.

Work with the existing code rather than replacing it unnecessarily.