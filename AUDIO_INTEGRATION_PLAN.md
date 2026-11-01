# Audio/video identification plan

## What works today
- Users can choose an audio or video file (up to 25 MB) or record from a microphone.
- The file stays inside the user's browser, stored in IndexedDB and associated with that vehicle's case.
- Files can be replayed from the history on the same browser/device.
- Text + guided answers and summaries of past issues are analyzed by Llama.

## Not yet implemented
**Automated recognition of the actual recorded sound is not available.** Meta Llama 3.2:3b, the app's default Ollama model, accepts text only. Do NOT tell users the existing Llama API can listen to attachments.

## Suggested next phase for OpenCode
1. Add a separate audio inference component that genuinely accepts waveform data (specialized sound event detection/classification model). For video, extract the audio track safely first, and optionally allow a separate vision model to inspect visuals.
2. Test a small, CPU-friendly automotive/audio-event classifier running locally, with clear model provenance and class label limitations.
3. Build a media analysis API that reads bounded-size files, checks actual formats, limits duration, rate-limits and times out work, and removes temporary server files.
4. Return `soundEvents`, model confidence and `limitations`; include the actual classifier's results as **supporting evidence** alongside user text for Llama.
5. Confirm Arabic/English output and never treat model output as conclusive vehicle diagnostics; include risk-specific safety warnings.
6. Require clear opt-in before transmitting recordings to any external/cloud model provider.
7. If model or media analysis fails, display a clear message. Do not invent a recognized audio result.

## Privacy
Vehicle cases and media currently remain in browser storage, except text descriptions and history snippets that are sent to the configured Llama backend. Never sync or upload sound recordings silently.
