# Compact Saudi-market evidence and answer-first behavior

## Scope and current limits

The initial focus catalog contains **18 vehicle models** across Toyota, Hyundai, Nissan, Kia and Ford. It is a curated starter scope for Saudi-market conversations, **not a verified sales ranking**. It stores bilingual model names and spelling variants, not model-specific defects, failure rates, engine assumptions or repair claims.

Included: Camry, Corolla, Yaris, Hilux, Land Cruiser, Fortuner, RAV4, Accent, Elantra, Sonata, Tucson, Sunny, Altima, Patrol, Pegas, K5, Sportage and Taurus. Other vehicles can still use shared guidance; the app does not force an unknown car into one of these profiles.

The selected vehicle name now accompanies the chat request. The server resolves one compact profile, including a user-supplied year where present. It does not send the complete model catalog to the language model or infer missing engine/generation details.

## Shared knowledge instead of duplication

The runtime reuses **40 bilingual symptom cards** and **30 bilingual conditional sound patterns** across vehicles. Existing source URLs and “not mechanic-confirmed” flags are retained. English translations were added to the 30 existing Arabic patterns; this is translation of existing guidance, not new mechanical validation. A braking shudder now matches the vibration pattern directly instead of being confused with a rattle.

The 28 existing YouTube metadata/topic entries now have Arabic/English summaries and localized retrieval. They remain unreviewed audio references, not 28 new clips or acoustic matches. The sound-topic vocabulary is curated text, not labeled recordings. No model weights were trained.

To expand without an uncontrolled dataset, research a small number of relevant, deduplicated evidence cards per model/year range. Prioritize manufacturer owner/service information, applicable official recalls, established automotive guidance, and independently reviewed recordings. Require exact year/engine applicability before making a model-specific claim. Retain source, review date, rights status, what the source actually establishes, and uncertainty. Do not copy the same generic problem into 18 vehicle datasets.

## External research is blocked

In addition to the blocked YouTube search for `اصوات مشاكل سيارات`, requests to Toyota Saudi, Hyundai, Nissan Saudi, The AA and RepairPal returned HTTP 403 in this cloud instance. The supported environment draft now includes those required domains along with YouTube media hosts, preserving existing custom settings. It must be saved/applied and published through environment settings before research can continue.

No new manufacturer pages, service bulletins, sales statistics or Shorts audio were inspected. New-source collection and verification remain pending. See `YOUTUBE_SHORTS_RESEARCH.md` and `data/research/youtube_shorts_research_status.json` for the provenance boundary and reusable public metadata collector.

## Preventing repeated questions

A compact per-case memory is derived from the full browser conversation before only recent turns are sent. It retains:

- Questions already asked, including reworded Arabic/English requests and imperatives.
- A bounded count that survives history truncation.
- A few user-authored details; prior assistant guesses are never promoted to user facts.

The planner never asks the same timing/texture/location topic again simply because the user answered “not sure”. Two useful details normally stop clarification. Successful Gemini sound descriptions can supply an explicitly uncertain texture, while timing/location come from the user's description. A maximum of two clarification questions applies to the continuing case; long conversations do not reset that budget.

The prompt leads with up to three evidence-supported possibilities, a brief explanation and a concrete safe next step. It asks one genuinely missing question only when useful. Question enforcement also removes repeated imperative requests, preserves source URLs, and can retain high-match sourced guidance when a weak model returns only questions. Important safety advice takes priority. This improves response policy; it does not establish measured vehicle-fault recognition accuracy.

## Speech and UI

Independent Groq/local speech fallback can recover words when sound interpretation is unavailable, preserving Arabic or English. The transcript is visible and correctable. Neither a transcript nor an audio label confirms a vehicle fault. Existing storage formats, provider settings, media privacy and the mechanic UI remain in place.

## Validation

New regressions cover long-case memory after prompt truncation, semantic question repetition, unknown answers, source-link preservation, Arabic normalization, vehicle aliases/years and explicit corrections, audio-plus-description evidence, and the real chat route using the exhausted budget. Browser checks verify module loading, transcript/correction UI, selected-vehicle payload and case-memory payload. Provider responses are fixtures; live inference needs the user's own provider access.

## Natural conversation before symptom clarification

A greeting, thanks or a general/educational question is no longer treated as a vague car-noise complaint. `conversationMode` separates greeting/closing, direct questions and real problem reports. The app preserves the model's natural welcome or direct answer and does not append a canned timing question. An old car complaint does not force a new greeting back into diagnosis.

For example, `سلام عليكم` receives a natural greeting; `وش يعني بوري؟` receives an explanation. `السلام عليكم عندي صوت غريب بسيارتي` can acknowledge the greeting and clarify the actual issue. Once a real problem is stated, the model may ask one useful missing detail in its own words. It is no longer required to copy a fixed question, and a useful answer without a question stays that way. Existing case memory, two-question limit, known-detail filtering and safety behavior remain.
