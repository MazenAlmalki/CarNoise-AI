# OpenCode task — CarNoise AI

Read the existing repository, including README.md, server/index.js and public/app.js. The user wants **real Meta Llama integration** using your available access.

1. Identify an authorized Meta Llama provider, correct model ID, API endpoint and authentication. Do not invent credentials.
2. Integrate into server/index.js (or verify current adapter works). Preserve POST /api/analyze request/response structure and existing Arabic RTL UI.
3. Store credentials ONLY in a local .env or secure hosting environment, not in source, git or frontend.
4. Run npm install, npm run check, start the app, test /api/health, validation, genuine Llama results, failures, timeout, missing and malformed model outputs.
5. Verify Arabic responses and safety-conscious wording. Never promise a confirmed diagnosis of a car fault based on text. Treat braking, steering, smoke or loss of control as potential urgent risks; recommend professional inspection, not DIY dangerous repairs.
6. Verify mobile and desktop layout and deploy on HTTPS if hosting access is available.
7. Report exact model, tests performed, changes made, deployment URL if real, and limitations.

Do NOT unnecessarily rebuild the frontend, and do NOT touch unrelated repositories.