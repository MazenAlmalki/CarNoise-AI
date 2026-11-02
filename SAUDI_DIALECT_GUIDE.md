# Warshatak — Saudi Dialect & Natural Conversation Expansion

**Added November 2, 2026**

This is a contextual **Saudi Arabic language-understanding layer**, not fine-tuning and **not** a set of mechanic-confirmed repairs. Its job is to help the language model interpret words and intent while still letting the model generate a natural response.

## New files and actual quantities

| File | Count | Provenance | Purpose |
|---|---:|---|---|
| `data/saudi_dialect_glossary_v1.json` | **128** | Author-curated illustrative Saudi phrases | Vehicle terminology, everyday conversation, unclear meanings |
| `data/saudi_conversation_edge_cases_v1.jsonl` | **204** | Synthetic variants generated from 51 scenarios | Test greetings, joking, vague/odd questions, contradictions, user corrections, off-topic questions and media failures |
| `data/saudi_synthetic_utterances_v1.jsonl` | **1,200** | Generated from 40 source-linked symptom records | Search phrase variation; not 1,200 unique faults |
| `data/saudi_dialect_aliases_v1.json` | **124** | Handwritten language variants | Extra search synonyms |
| `data/typed_symptoms_v1.json` | **40** | Publisher-linked, paraphrased general automotive guidance | Possible causes and cautious advice |
| `data/saudi_official_context_v1.json` | **7** | Government/official publisher notes | Saudi recalls and safety context |

The counts of language variants and conversation tests must **never** be presented as independently confirmed automotive fault cases.

## Runtime behavior

- `server/saudiDialect.js` finds a small number of matching contextual glossary entries (maximum five by default). Ambiguous words are identified as ambiguous.
- It also recognizes conversational intent when appropriate: `greeting`, `joke`, `unclear`, `correction`, `contradiction`, `media_failure`, `not_vehicle`, `limits`, `pricing`, `recall`, `safety`, `preferences`, and `followup`.
- `server/saudiKnowledge.js` avoids automatic car-fault probing on greetings, jokes, unrelated questions or clarifications.
- `server/index.js` sends a **bounded interpretation** to the configured LLM alongside the original question and relevant automotive references. The model writes the user-facing reply, rather than copying any stored example.
- When the audio/video model fails or is disabled, `mediaFailure` is passed to LLM so it acknowledges the limitation **instead of claiming to have heard the sound**.
- No source establishes the mechanical cause of one specific customer's issue: the assistant must state uncertainty and ask a helpful, relevant clarifying question if needed.

## Example distinctions

| User wording | Interpretation, not a canned answer |
|---|---|
| `سيارتي ترج وهي واقفة` | Shaking/vibration at idle; do not interpret as leaning |
| `سيارتي زعلانة مني` | Joke/metaphor, **not** mechanical evidence |
| `القير ينتع` | Transmission jerks; need context such as when shifting |
| `اسمع صوت بس مدري من وين` | Unclear sound; ask about timing or type, not assert a component |
| `ياخي ما فهمت قصدي` | Accept correction and update interpretation |
| `كم عمرك` | General question; no forced vehicle diagnosis |
| `عطني الزبدة` | User wants a short answer |
| `أرسلت المقطع وش سمعت؟` | Say sound was not analyzed if audio model is disabled or failed |

## How to validate locally

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd install
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Then open `http://localhost:3000` and send the example messages above in separate conversations. Compare whether the AI acknowledges jokes, requests one useful clarification when needed, and correctly preserves Saudi dialect meanings.

**Validated so far:** source syntax and isolated intent/retrieval logic checks passed. **Not yet validated on this user's Windows machine:** end-to-end model generation, audio understanding, real Saudi user comprehension accuracy, and actual mechanical diagnostic performance.

## Important quality caveats

- A glossary is not a complete representation of Saudi Arabic; regional vocabulary and context vary.
- Short expressions can have multiple meanings, so retrieval must not assume a specific fault.
- Model-generated language can still be wrong even when the retrieved context is correct.
- More generated phrases improve *coverage and testing*, not necessarily clinical/mechanical accuracy.
- For real-world quality evaluation, obtain permissioned, anonymized, mechanic-verified cases and test on held-out conversations.
- Do not ask users to publish personal VINs, license plates, names or phone numbers.

The original technical sources for the 40 automotive cards and 7 Saudi official notes are documented in [REFERENCES.md](REFERENCES.md).
