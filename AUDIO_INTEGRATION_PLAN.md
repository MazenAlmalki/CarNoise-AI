# Audio and video implementation status — Warshatak V5

**Last updated: November 2026.** This document supersedes the older V3 plan. For installation, read [MULTIMODAL_SETUP.md](MULTIMODAL_SETUP.md).

## Implemented in GitHub source
- The user may attach an **image, audio or video** to their first message, or record with a microphone.
- Upon clicking **Send**, a temporary copy of the attached file is uploaded to the local Express server with the user's text. The browser also saves media to IndexedDB for future playback. Maximum size is 25 MB.
- Images are analyzed by a separately configured Ollama vision model (default `qwen3-vl:2b`).
- Videos use FFmpeg to extract up to two **still frames** (0s and 2s) that the visual model can describe.
- A separate optional **CLAP** audio model can compare uploaded audio to descriptions such as engine ticking and brake squeal. This requires Python, PyTorch, Transformers and FFmpeg; it is **disabled by default**.
- The chat model uses available media observations as *tentative context*. If a media subsystem fails, the UI warns the user and continues with text-only chat.

## Not yet verified or implemented
- End-to-end working inference on the user's Windows/Ollama machine; model downloads and audio dependencies are still required.
- A calibrated audio similarity index against over 1,000 real **rights-cleared, professionally labeled** car recordings.
- Speech transcription from voice messages (CLAP is **not** a speech-to-text model).
- True full-length video understanding: only sampled frames plus optional soundtrack are processed.
- Professional mechanical fault diagnosis, repair confirmation, or measured audio-model accuracy.
- Full production-grade media hardening, detailed consent management and public deployment.

## Next development milestones
1. Install and test the small text model, vision model, FFmpeg, and optional CLAP service on the target machine.
2. Test real short audio and video examples while monitoring RAM usage and latency; 8 GB RAM can be restrictive.
3. Add a separate automatic speech-recognition model if users need voice commands or dictated problem descriptions.
4. Build rights-cleared car-noise embeddings and an evaluated similarity search against verified test cases.
5. Add explicit media consent, robust content validation, safe storage/retention and authenticated access before public deployment.

## Why a similar sound is not a diagnosis
A CLAP score indicates how compatible audio is with a generic sound description, not that a specific car part is defective. Many components create similar sounds. Any high-risk brake, steering, fire or overheating symptoms must prioritize safe human inspection over model certainty.
