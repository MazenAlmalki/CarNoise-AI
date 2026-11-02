# Warshatak — Car Noise Video Research and Guided Clarification

**2026-11-02 | V5.10**

## What's in the project now

- **8 YouTube videos, 28 linked educational topic segments** recorded as public video metadata in `data/youtube_car_sound_references_v1.json`. Some entries point to different published timestamps of the same video. All are marked `actual_audio_verified:false`, because the soundtracks were not acquired or independently listened to in this environment. A video title or timestamp **does not constitute a labeled training audio file**.
- **67** human-authored sound captions in `data/car_audio_captions_v2.json` used at runtime by optional CLAP, covering engines, starting, brakes, wheels, belts, fans, suspension, exhaust and ambient noise.
- **536** *synthetic* Arabic/English-mixed descriptions in `data/sound_description_examples_v1.jsonl`, generated from the 67 caption types. These are **not 536 real YouTube recordings** or verified mechanic labels.
- **40** publisher-linked automotive general symptom guidance cards in `data/typed_symptoms_v1.json`.
- Two additional publisher explanations used to design cautious user questions:
  - [Christian Brothers Automotive — describing car noises](https://www.cbac.com/west-chicago/about-us/car-noise-descriptions/)
  - [FTC — Auto Repair Basics](https://consumer.ftc.gov/sites/default/files/articles/pdf/pdf-0078-auto-repair.pdf).

## How it works

1. User sends a recording. Warshatak first attempts the configured media pipeline: FFmpeg waveform, optional CLAP event matching and optional Whisper speech transcription.
2. If CLAP provides candidate sounds, the AI uses them as **uncertain similarities**, not confirmed faults.
3. If CLAP *runs but cannot produce useful sound information*, the application asks questions one at a time: **Where does the noise come from? → When does it happen? → What does it sound like?**
4. If CLAP is **disabled**, it does **not** pretend that sound recognition happened. It offers a **Describe sound manually** action; only after user consent does it ask the above questions.
5. If CLAP crashes or the media cannot be decoded, it states that recognition failed, may show the relevant error, and then offers guided description questions. The user’s responses are explicitly tagged as user-supplied observations.
6. After the last answer, the LLM receives the combined location, timing and sound texture and writes a **natural, uncertain explanation** using existing symptom cards and relevant video references.
7. YouTube sources are surfaced as **optional background reading** only when the user's text matches a known topic. They are not claimed as a match to the actual uploaded audio.

## Video metadata integrity

The video metadata index includes:
- Budget Mechanic: [Don't Ignore These 8 Car Noises](https://www.youtube.com/watch?v=D1dJlbKR8JE) (2026) — publisher-labeled time segments for clunks, squeals, grinding, humming, hissing and knocking
- Budget Mechanic: [All Car Noises Explained](https://www.youtube.com/watch?v=rZGpjvjaoJA) (2021) — publisher description of eight categories
- The Joy of Wrenching: [Wheel bearing audio example](https://www.youtube.com/watch?v=liBzed1tQTA)
- Despair Repair: [Starter noises explained](https://www.youtube.com/watch?v=9cF__aKfQ5A) — published timestamps for clicks, cranking and grinding
- Barbour's Auto Help: [CV axle clicking example](https://www.youtube.com/watch?v=sNuEUwOq4k0)
- Engineering Explained: [Engine knock](https://www.youtube.com/watch?v=maZyPJIOknE)
- The Car Care Nut: [Catalytic converter explanation](https://www.youtube.com/watch?v=ww0ottmbzes) — educational context, **not a labeled acoustic sample**
- Cupsa Aurelian: [Turbo whistle anecdote](https://www.youtube.com/watch?v=97oWGy38HQY) — uploader uncertainty preserved.

Do not describe an uploaded recording as a verified match to any video, or claim that a video's suspected fault is mechanically confirmed for other vehicles.

## Test locally

```powershell
cd "$HOME\Documents\CarNoise-AI"
git pull origin main
npm.cmd run check
npm.cmd test
npm.cmd run dev
```

After a fresh browser reload, upload a short car recording and ask for analysis. If CLAP is disabled, the app should explicitly say so and offer **ابدأ وصف الصوت**; otherwise after a failed attempt it begins with **وين تسمع الصوت؟**. Select location → time → sound description to complete the interview. You can still type instead of choosing a chip.

**Caveats:** These additions are metadata, synthetic text and a clearer conversational flow. They do **not** automatically train new model weights, copy YouTube audio, or establish measured sound-recognition accuracy on a held-out test dataset. Actual audio samples with appropriate permissions and reliable labels would be needed to measure and improve classifier performance. Do not record car sounds while driving or put yourself in unsafe situations.
