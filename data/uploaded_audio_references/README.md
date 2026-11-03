# Uploaded audio references / مراجع الصوت المرفوعة

Two user-supplied MP4 compilations (28.235 and 21.641 seconds) contain 15 visually identified title cards. Short central audio windows were extracted with FFmpeg as mono 16 kHz PCM WAV, retaining actual audio rather than generating synthetic sounds. Original video hashes, exact extraction windows, WAV hashes and measured RMS/peak levels are in `manifest.json`. The original MP4s are not included.

The titles were manually read from sampled frames. They are **uploader claims**, not independently verified diagnoses. English labels are editorial translations; local terms such as البالات, بطة السير, سير التيمت and علبة السكان may be imprecise. No vehicle model/year/engine was established. The library must not be described as Saudi-model-specific evidence. No Gemini key was available during preparation: `audio_reviewed_by_gemini=false` is intentional. Signal measurements establish usable nonzero audio, not what produced it. No live recognition accuracy, unrelated-noise rejection rate or mechanical diagnosis has been validated.

| ID | Source video | Window (seconds) | On-screen label | English interpretation |
|---|---|---|---|---|
| upload1-01 | بعض أصوات الأعطال في السيارة.mp4 | 0.5–3.0 | بطة السير | Accessory belt pulley (uploader label) |
| upload1-02 | بعض أصوات الأعطال في السيارة.mp4 | 3.8–6.3 | القماشات | Brake pads |
| upload1-03 | بعض أصوات الأعطال في السيارة.mp4 | 7.6–9.8 | صليبة العكس | Driveshaft universal joint |
| upload1-04 | بعض أصوات الأعطال في السيارة.mp4 | 10.8–13.2 | البالات | Valvetrain (uploader terminology) |
| upload1-05 | بعض أصوات الأعطال في السيارة.mp4 | 14.4–16.7 | طرمبة الماء | Water pump |
| upload1-06 | بعض أصوات الأعطال في السيارة.mp4 | 17.7–20 | السلف | Starter motor |
| upload1-07 | بعض أصوات الأعطال في السيارة.mp4 | 21–23.5 | جوزة المقصات | Suspension ball joint |
| upload1-08 | بعض أصوات الأعطال في السيارة.mp4 | 24.6–27.3 | البطارية | Battery |
| upload2-01 | بعض اصوات اعطال السيارة 2.mp4 | 0.2–2 | ربلة كرسي المساعد | Strut mount rubber |
| upload2-02 | بعض اصوات اعطال السيارة 2.mp4 | 3–4.8 | ربلة المساعد | Shock absorber bushing |
| upload2-03 | بعض اصوات اعطال السيارة 2.mp4 | 5.8–7.7 | مروحة التبريد | Cooling fan |
| upload2-04 | بعض اصوات اعطال السيارة 2.mp4 | 8.7–10.7 | بيرنج الدينمو | Alternator bearing |
| upload2-05 | بعض اصوات اعطال السيارة 2.mp4 | 11.7–13.7 | كرسي المكينة | Engine mount |
| upload2-06 | بعض اصوات اعطال السيارة 2.mp4 | 14.7–16.7 | سير التيمت | Timing drive (uploader terminology) |
| upload2-07 | بعض اصوات اعطال السيارة 2.mp4 | 17.8–19.8 | علبة السكان | Power steering unit (uploader terminology) |

## Runtime comparison

With `AUDIO_PROVIDER=gemini` and a working `GEMINI_API_KEY`, the server sends the target excerpt first, then all 15 reference WAV excerpts with opaque IDs. Component labels are withheld during comparison to reduce label priming. Only after the response passes schema/ID checks does the server attach the bilingual uploader label to a returned match. Reference speech is explicitly excluded from the target transcription. This is in-context audio comparison, **not training or fine-tuning**, and has no persistent effect on Google's model.

The output distinguishes `clear`, `partial`, `none`, and `unclear`; it contains reasoning and no invented confidence percentages. Only a single clear match to a clear target suppresses automatic clarification. Ambiguous or unknown targets allow one useful question per reply, within the existing two-question case budget. A clear sound outside this small library can still be described without a forced catalog match. Existing safety guidance takes priority.

The reference set adds roughly 33 seconds of audio input to **each** request, affecting provider usage and latency. Set `GEMINI_REFERENCE_AUDIO=0` to disable reference comparison while retaining ordinary Gemini sound description/transcription. Existing user uploads remain bounded by `GEMINI_AUDIO_MAX_SECONDS`; reference audio is separate from that bound. The server caches verified bytes/base64; changes to manifest or file metadata invalidate the cache and trigger hash verification. Audio is not exposed through the static public directory.

For validation, run `node --test tests/audioReferences.test.js`. These tests use real reference WAVs/FFmpeg and mocked Google responses. Before trusting recognition, test live with the same excerpt, different recordings of the same event, unrelated music/speech/silence, background noise and sounds absent from this library. Matching its own reference is not evidence that a model generalizes to real vehicle faults.

## V2 evidence metadata

Manifest v2 retains every original ID, WAV hash, title and extraction window, while adding separate `reported_problem`, pending `acoustics`, source groups, unknown recording conditions and usage-permission scope. All titles are unverified suspected faults. Latest video uploads match the original hashes exactly. See [../car-audio/README.md](../car-audio/README.md) for the inventory, independent-review requirements and evaluation workflow. No automatic model output becomes ground truth.
