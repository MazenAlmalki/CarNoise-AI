# Saudi Automotive Terminology and Bilingual Conversation — V5.5

Date: November 2, 2026

## Scope and provenance

This release adds **89 carefully authored Saudi/Gulf car-part and symptom concepts**, **317 forms/aliases**, and **1,068 bilingual (Arabic and English) synthetic dialogue examples** (12 question/answer-behavior examples per concept).

These are **not** records of 1,068 verified customer repairs and **not** model fine-tuning. `server/saudiCarTerms.js` indexes the 89 live definitions; the language model receives only the few matching meanings and clarifying questions at runtime. The 1,068 examples are for future testing, review and prompt design; they are **not all sent to Ollama** on each turn because that would overwhelm an 8GB CPU-only laptop and reduce answer quality.

Previous corpus remains: 40 publisher-linked automotive symptom cards, 1,200 synthetic Arabic complaint variants, 124 extra slang aliases, 128 broad Saudi expressions, 204 synthetic odd-question variations, and 7 official Saudi context items.

## Car-specific Saudi meanings

- **بوري / البوري**: vehicle horn (not motor noise).
- **جلنط / هاند بريك**: hand/parking brake (not the main service brake pedal). May be manual or electronic parking brake.
- **شمعات**: depending on context, could refer to headlights or spark plugs; ask which.
- **دعسة**: may mean the brake pedal or accelerator; ask which when unclear.
- **وزنية**: could mean wheel alignment or another adjustment; ask what they mean.
- **تنسيم**: a leak; ask whether tire air or another system.
- **دبل**: a term associated with four-wheel-drive/transfer-case configurations.
- **المكينة / السلف / الدينمو / الكتاوت / الطرمبة / الدفرنس / المقصات / المساعدات**: commonly used car component names, mapped to English equivalents and short context-sensitive meanings.

Local language is not uniform; a user may use these terms differently. Always ask **one helpful, short question** when a meaning cannot be inferred.

## English mode fix

`server/chatLanguage.js` determines the reply language from the typed message; the UI switch is used as a fallback for numbers and short/ambiguous messages.

Examples:
- Arabic UI + `My horn is not working` => **English reply**
- Arabic UI + `What does parking brake mean?` => **English reply**
- English UI + `البوري ما يشتغل` => **Arabic reply**

`server/index.js` now explicitly tells the language model to respond in the inferred language. This fixes a **server language-selection issue**, but if English still fails with HTTP errors on a user's machine, further Ollama/backend investigation is needed.

## Conversation design

For a clear question about a part: explain its role and meaning, without treating the mentioned part as confirmed broken.

For an unclear symptom: do not fabricate diagnoses; ask when it happens, what the user means or what warning appears.

For an ambiguous word: state the most likely meaning and ask `تقصد ...؟` / `Do you mean ...?`.

For a joke, greeting or off-topic question: respond conversationally; avoid forced fault diagnosis.

For failed media analysis: explicitly say the recording wasn't analyzed; ask for a text description. Never imply sound classification when CLAP isn't enabled.

For safety-critical brake/steering/overheating/fire symptoms: prioritize stopping safely and seeking professional help rather than hazardous repair advice.

## Data files and tooling

- `data/saudi_car_terms_v1.json`: 89 entries / 317 variants.
- `data/saudi_car_dialogue_examples_v1.jsonl`: 1,068 **synthetic** Arabic-English paired dialogue behaviors.
- `server/saudiCarTerms.js`: runtime term matching and glossary retrieval.
- `server/chatLanguage.js`: runtime typed-language detection.
- `tests/saudiCarTerms.test.js`: tests for both languages, core slang, ambiguity, data size and provenance.
- `SAUDI_DIALECT_GUIDE.md` and `SAUDI_KNOWLEDGE_REPORT.md`: earlier corpus design and limits.

## References

Relevant public terminology sources (paraphrased, not copied):
- [Motory Saudi — parking brake and جلنط](https://ksa.motory.com/ar/الاخبار/جلنط-هاند-بريك-سيارة/)
- [StriveME — brake pads, rotors and جلنط](https://striveme.com/article/محركات/أخبار/إليك-معنى-فحمات-السيارة-وهوبات-السيارة-وقماشات-السيارة-وتيل-الفرامل-وجلنط)
- [Saudi owner community terminology list — بوري / الجلنط](https://montada.haraj.com.sa/58319/)
- [RAC — overview of dashboard warnings](https://www.rac.co.uk/drive/advice/know-how/car-dashboard-warning-lights-meaning/)

Additional author-curated synonyms are explanatory examples, **not** independently verified regional dialect observations. Avoid representing every term as sourced from those four references.

## Test on the correct local clone

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Use a new browser chat and try:
- `وش يعني بوري؟`
- `الجلنط ما يمسك، وش تقصد بالجلنط؟`
- `وش هي الشمعات؟` (should clarify if context is ambiguous)
- `My car horn is not working`
- `What is a parking brake?`
- `My car shakes when idling. What should I check?`

Quality is **not** guaranteed by corpus size, and the local LLM's speed/accuracy must be validated on the user's own computer.
