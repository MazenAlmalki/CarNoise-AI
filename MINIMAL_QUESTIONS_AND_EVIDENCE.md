# Warshatak — Minimal Questions & Conditional Automotive Evidence (2026-11-02)

## Why the assistant repeated questions

The previous LLM prompt encouraged conversational clarification but did not have a deterministic limit on question count. In addition, the audio clarification wizard required three consecutive answers (location, timing, texture) regardless of whether two answers already allowed useful broad guidance. The language model could then ask another question, making the experience repetitive.

## Changes to question policy

- `server/minimalQuestions.js` reads user-authored conversation turns to find known **timing**, **sound type/texture**, and **approximate location**.
- Once **two useful symptom dimensions** are present, the chatbot must **respond with cautious possibilities**, not insist on completing every field.
- For unclear input, it asks **at most one focused question per message** and no more than **two prior assistant clarification questions** in the thread. A response-processing guard removes additional questions while preserving the main explanation.
- Previously answered question topics should not be asked again; if safety-critical symptoms are present, prioritize professional safety advice over an interview.
- The audio wizard now finishes after **two** user choices (where/when), not three. If the user already describes the sound in the chat, that information can still inform retrieval; sound is not assumed from waveform metrics.
- A rough local heuristic cannot perfectly detect every paraphrase or identify independent new topics. Evaluate manually and adjust rules using logged, privacy-safe test cases.

## Source-based conditional pattern library

`data/conditional_noise_patterns_v1.json` adds **30 authored source-grounded conditional patterns from 9 distinct source URLs**, with acoustic description, triggering circumstance, location, possible categories of concern, safety urgency, and an explicit **unverified** label.

The active retriever `server/conditionalNoiseRetrieval.js` requires **at least two matching features**. It does not return guesses based merely on a single word like "noise" or "car". The resulting cards are offered to the LLM as **possible explanations** and linked references, never mechanically confirmed failures.

This complements the existing **40** symptom cards, **28** YouTube video-topic references from **8** videos, **67** CLAP candidate descriptions, and **536** synthetic user-utterance samples. These categories overlap: **do not sum them as independent diagnosed vehicles or verified audio clips**. The YouTube index is video publisher metadata, not downloaded sound files. Adding descriptions does not retrain CLAP's neural weights.

### Selected external sources

- [The AA, Unusual car noises](https://www.theaa.com/car-care/advice/servicing/guide-to-unusual-car-noises): noises by braking, acceleration, turning, idling
- [RepairPal, Hearing noises from car](https://repairpal.com/symptoms/hearing-noises-from-car): possible sources under different operating conditions
- [RepairPal, Wheel bearings](https://repairpal.com/wheel-bearing): road-speed hum vs. tire/road surface effects
- [RepairPal, Brake pads](https://repairpal.com/brake-pads): squeal/grinding and safety context
- [RepairPal, Engine ticking](https://repairpal.com/symptoms/engine-ticking-noise-causes): potential normal and concerning ticking contexts
- [Firestone, Rattling noises](https://www.firestonecompleteautocare.com/blog/maintenance/car-making-rattling-noise/): cabin, suspension, engine and exhaust locations
- [Firestone, CV axle symptoms](https://www.firestonecompleteautocare.com/blog/maintenance/bad-cv-axle-symptoms/): clicking during turns and drivetrain possibilities
- [Cars.com, Squealing noise](https://www.cars.com/articles/why-does-my-car-make-a-squealing-noise-486037/): squeal under braking, turns, acceleration and A/C
- [Budget Mechanic YouTube, All Car Noises Explained](https://www.youtube.com/watch?v=rZGpjvjaoJA): video publisher-described examples of brakes, belts, steering, wheels, CV joint, suspension and exhaust

Source metadata, descriptive text, and patterns were summarized in original words. Audio and individual mechanical faults have not been externally verified by a mechanic or labeled on actual user vehicles.

## Example flows

1. User: `اسمع صرير لما افرمل` → no further questions necessary; provide possibilities (pads or debris) and safe next step.
2. User: `صوت غريب` → ask only about **when** it happens. Follow up on missing detail only if indispensable and within the question limit.
3. User: `طقطقة لما ألف الدركسون` → discuss broad CV joint/wheel explanations without diagnosing a specific fault; don't ask all three wizard questions.
4. User reports loss of braking or severe overheating → safety-first response, not a quiz.

## Verify on Windows

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

Create a **new chat** to evaluate the updated logic without the historical repeated assistant questions stored in a prior case. If Groq API is used, set `CHAT_API_URL` and `CHAT_MODEL` to IDs actually returned by your account's model-list endpoint. Llama-only model names are **not automatically available on Groq**. Image recognition remains independent and must use a supported vision model/provider; the local knowledge library cannot substitute for image or audio classifiers.

**Validation status:** Source code syntax and deterministic sample messages were checked, but end-to-end local Node/Groq/browser tests have not been run against the user's computer.
