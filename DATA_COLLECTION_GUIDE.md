# CarNoise AI — Data collection and evaluation guide

## Goal
Improve **possible causes and safe next-step guidance**, not provide guaranteed vehicle diagnoses. User descriptions alone are not diagnostic ground truth.

## Gather three kinds of data
1. **Verified knowledge cards:** symptom/noise, operating condition, location, potential explanations, urgent warning signs, and sources such as car service manuals, published automotive technical information or mechanic-reviewed notes.
2. **Real confirmed service cases (with consent):** anonymized symptom report, vehicle model/year, findings confirmed by a qualified mechanic, repair outcome and date. Keep unverified user guesses separately.
3. **Audio examples (future classifier):** recordings of engine/brake/road noises with permission, audio duration/format, context, and *mechanic-verified* label if available. Never label recordings by guessing from sound alone.

## Suggested labeled CSV columns
`case_id,vehicle_make,vehicle_model,model_year,sound_type,sound_description,when_occurs,location,frequency,warning_signs,possible_causes,confirmed_issue,confirmed_by,source_url,verification_status,consent_for_reuse,notes`

Mark `verification_status` as one of: `unverified`, `source_reviewed`, `mechanic_verified`. Leave `confirmed_issue` empty until independently verified. Exclude names, license plates, VINs, phone numbers, exact locations and faces/voices without consent.

## Where to start
- Build 15–30 short, cited knowledge cards for common categories: braking, startup, turning, suspension, wheels, accelerating, idling. **Do not invent mechanical conclusions**.
- Ask a qualified mechanic to review the cards.
- Create 20–30 diverse test questions with expected response properties (possible explanations, uncertainty statement, safe escalation).
- Add a feedback action later: `Helpful / Not helpful / Mechanic confirmed problem`; only label verified outcomes as confirmed.
- For audio research, the *OtoMobile Dataset* is a small research collection of annotated failing car component recordings (65 clips). It is restricted; review its access terms and permissions rather than assuming it can be freely reused: https://zenodo.org/records/3382945 .

## How to connect data to Llama
For V1, **use retrieval-augmented generation (RAG), not model fine-tuning**:
- Keep approved knowledge cards in JSON or SQLite.
- Extract the user's description and four answers.
- Retrieve the few most relevant verified cards using keywords/aliases in Arabic and English; later add embeddings if needed.
- Pass the retrieved cards and their sources to Llama, instructing it to discuss possibilities and uncertainty, and to explicitly say when evidence is insufficient.
- Validate JSON output and show safety warnings. Never let past guesses become confirmed facts.

A labeled audio collection does **not** make the existing Llama 3.2 text-only model recognize sounds. That requires a separate audio classifier.

## Evaluate
Track correctness against verified cases, severe-warning recall, unsupported certainty, Arabic/English clarity, JSON validity, and response time. Keep a separate held-out test set; do not use evaluation examples as retrieval answers.

## First steps
1. Fill `data/cases_template.csv` with consented, source-grounded cases.
2. Gather approved knowledge references with citations and review dates.
3. Have a mechanic validate technical claims.
4. Add retrieval to `server/index.js` **after** reviewing the collected data.
5. Maintain privacy and licensing records before using real audio/video.
