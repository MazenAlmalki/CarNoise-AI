# Warshatak — Saudi Car Problems Knowledge Expansion (November 2026)

This is a **provenance-aware text retrieval dataset**, NOT a dataset of 1,000 mechanic-confirmed damaged vehicles. A significant number of entries are synthetic sentence variants for understanding how people in Saudi Arabia describe problems.

## Inventory

| Data file | Quantity | Type | Used at runtime? |
|---|---:|---|---|
| `data/typed_symptoms_v1.json` | 40 | Source-linked general automotive symptom cards, not independently mechanic-confirmed | Yes: symptom retrieval |
| `data/saudi_dialect_aliases_v1.json` | 124 | Handwritten Saudi colloquial aliases, **not** validated service cases | Yes: symptom retrieval |
| `data/saudi_synthetic_utterances_v1.jsonl` | **1,200** | Synthetic Arabic phrasing variations, each mapped to one of the 40 cards | Yes: exact-phrase matching; also regression dataset |
| `data/saudi_official_context_v1.json` | 7 | Saudi government and official news references: vehicle recall service, summer safety, tire labeling, limited recall notices | Yes: context to LLM |
| `data/conversation_fallback_examples_v1.json` | 15 | Bilingual user-experience cases for unclear descriptions, failed media and conversational handling | Behavior-design examples; the runtime uses related guidance from `server/saudiKnowledge.js` |
| `data/knowledge_seed_v1.json` | 14 | Earlier source-grounded bilingual knowledge cards | Research reference, not indexed by new text retrieval |
| `data/source_comments_v1.json` | 12 | Paraphrased publisher advice, NOT user/technician comments | Research reference |

**Counting these entries as 1,412 diagnosed automotive problems would be misleading.** There are 40 runtime automotive source cards and 7 Saudi-context notes. The 1,200 variants and 124 aliases help the chatbot find the right card.

## How text analysis works

1. A user writes a free-form message (Arabic, Saudi dialect or English).
2. The backend normalizes common Saudi expressions using `server/saudiUnderstanding.js`.
3. `server/textRetrieval.js` searches the 40 automotive cards, including 124 additional dialect aliases and exact matches against 1,200 generated utterances.
4. `server/saudiKnowledge.js` retrieves relevant official Saudi guidance only when the user message warrants it. **No claim is made that a specific vehicle is subject to a recall without checking its VIN on the official website.**
5. Conversation guidance is added when evidence is weak, the user corrects the AI, or a recording could not be analyzed.
6. The configured LLM generates the natural-language response **in its own words**; retrieval supplies tentative sources, not prewritten answers.
7. For serious risks (e.g. brakes or control), safety advice takes precedence.

## Examples of uncertainty-aware conversational behavior

- **Unclear description:** “السيارة فيها صوت غريب.” The assistant should acknowledge insufficient detail, then ask *one relevant question* such as whether it is a squeal, click or hum and when it happens.
- **Follow-up:** “إيه يزيد مع المكيف.” The assistant should connect it to the **previous user complaint**, not treat it as a standalone fault.
- **Failed sound analysis:** “رفعته لك.” If a media model fails or CLAP is disabled, the assistant must explicitly say the recording was **not** analyzed, and ask for a verbal description or a clearer recording if safe.
- **Misunderstood wording:** “ترج مو تميل.” The assistant should acknowledge the correction and reinterpret the issue as vibration.
- **Recall:** “سيارتي فيها استدعاء؟” Refer the user to the Ministry of Commerce's official lookup; do not request their VIN in chat or guess based on vehicle brand.

These are **desired behaviors**, not results from a completed study with mechanics. Real-world conversation quality still needs evaluation on the user's device.

## Source and license integrity

**Saudi official references**
- Ministry of Commerce vehicle recall search (official): https://mc.gov.sa/ar/eservices/Pages/ServiceDetails.aspx?sid=30
- Civil Defense summer vehicle fire prevention: https://998.gov.sa/Main/Page/News/2751/
- Ministry of Commerce tire labeling/conformity inspections: https://mc.gov.sa/en/mediacenter/News/Pages/18-04-23-01.aspx
- Ministry of Commerce Toyota/Lexus parking assistant recall notice (13 April 2026): https://mc.gov.sa/ar/mediacenter/News/Pages/13-04-26-01.aspx
- Ministry of Commerce Nissan Altima / Infiniti engine recall notice (3 September 2025): https://mc.gov.sa/en/mediacenter/News/Pages/03-09-25-01.aspx
- Saudi Press Agency Nissan Magnite brake recall: https://www.spa.gov.sa/en/N2395778
- Saudi Press Agency Nissan Patrol transmission control recall: https://www.spa.gov.sa/en/N2389233

**General symptoms** are linked individually in `data/typed_symptoms_v1.json`, predominantly from AAA, The AA, RAC, and the U.S. FTC.

The project does **not** scrape private customer messages, claim repair outcomes it does not have, or assert that a generic noise uniquely identifies a faulty component.

## Recommended future data for real diagnostic improvements

Obtain **consented, anonymized, mechanic-confirmed** service records with vehicle make/model/year, odometer bracket, climate/operating condition, symptom, inspection findings, confirmed cause, outcome and date. Preserve source reliability. Do not store names, license plates, VINs, phone numbers or precise locations. Evaluate on entirely held-out vehicles and recordings, prioritizing hazardous false reassurance.

## Testing

```powershell
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

`npm.cmd test` includes regression tests for data completeness, dialect aliases, vehicle-recall safeguards, incomplete audio, unknown descriptions and sample retrieval against the 1,200-phrase corpus.

**Status:** Files are committed and code-based retrieval checks have passed in an isolated environment. End-to-end running Ollama responsiveness and the quality of the generated answers still require validation on the target Windows laptop.
