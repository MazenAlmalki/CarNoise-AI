# Warshatak V5 — Multiple AI Models: Text + Images + Car Audio + Video

**Status:** Code integrated in repository. **Not yet validated end-to-end against installed models on the user's laptop.** Do not describe video audio or sound classification as available until dependencies are running.

## What each model actually does

| Input | Model | Output and limitations |
|---|---|---|
| Typed text / multi-turn chat | `qwen3.5:2b` on Ollama (`CHAT_MODEL`) | Natural chat with prior turns, local keyword-retrieved knowledge, approximate possibilities. Small model may make errors. |
| Photo / still video frames | `qwen3-vl:2b` on Ollama (`VISION_MODEL`) | Brief **visual** observations. Does not hear sound or prove a mechanical fault. |
| Car noise or soundtrack | **Optional** `laion/clap-htsat-unfused` via Transformers/PyTorch | Top ranked **sound-text similarity candidates**, NOT probabilities or mechanical diagnoses. Requires separate Python installation and FFmpeg. |
| Video file | FFmpeg 2 still frames + vision model; optional CLAP soundtrack | Samples at 0 and 2 seconds; does not interpret the entire video. If audio model is disabled, only the visuals are analyzed. |
| Knowledge | `data/typed_symptoms_v1.json` + keyword matching | Up to 3 source-backed reference cards; not mechanic-confirmed faults. |

**Why several models?** Text LLMs cannot listen to waveforms just because a user uploads them. The media route explicitly uses separate specialized models and feeds *their tentative observations* into the conversation.

## Windows installation for a laptop with 8 GB RAM

1. Update [Ollama](https://ollama.com/download) to current stable version. You can keep Llama 3.2 installed.
2. Open PowerShell:
   ```powershell
   & "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull qwen3.5:2b
   & "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull qwen3-vl:2b
   & "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" list
   ```
   If `ollama` is already in PATH, you may use `ollama pull ...` instead.
3. In the project directory, copy `.env.example` to `.env` if needed, then **edit the existing `.env`** to set:
   ```dotenv
   CHAT_MODEL=qwen3.5:2b
   LLAMA_MODEL=qwen3.5:2b
   OLLAMA_HOST=http://127.0.0.1:11434
   VISION_MODEL=qwen3-vl:2b
   ENABLE_AUDIO_CLAP=0
   ```
   **Do not commit your real `.env`**, even when API keys are empty.
4. In project folder:
   ```powershell
   npm.cmd install
   npm.cmd run check
   npm.cmd run dev
   ```
5. Open `http://localhost:3000` and test chat with "السيارة ترج وهي واقفة" (then "تزيد إذا شغلت المكيف") and attach a car photograph. Files upload to **your local Express server only after pressing Send**; the backend deletes its temporary media files when processing finishes. Never assume a remote cloud service is used unless you configure one.

### Video and optional audio prerequisites
- To analyze video frames, install **FFmpeg**, ensuring `ffmpeg -version` works in PowerShell, or set `FFMPEG_PATH` in `.env` to the exact executable path. FFmpeg is **not** bundled with this project.
- **Audio classification is optional and much heavier than chat**. It adds a PyTorch model to memory. 8 GB RAM may be too little for simultaneous use; using a separate better-provisioned device or hosted audio service is recommended.
- On a compatible Python 3.10+ environment, install an appropriate CPU PyTorch release following [PyTorch's official selector](https://pytorch.org/get-started/locally/), then:
   ```powershell
   python -m pip install numpy transformers
   ```
  These packages and the CLAP weights may take substantial space. A model is downloaded from Hugging Face on its first run. Install only when sufficient disk/RAM resources are available.
- If audio prerequisites are installed and tested, change `ENABLE_AUDIO_CLAP=1` in your private `.env` and restart Node.
- For audio troubleshooting, run `python scripts/analyze_car_audio.py C:\path\to\short_clip.wav` directly. Its JSON output lists **relative similarities**, which are not calibrated diagnosis probabilities.
- Audio recording formats supported by the browser vary; FFmpeg must be able to decode them. If no audio is present in a video, the app reports that video sound couldn't be examined.
- **Privacy:** uploading images/audio/video now sends them to your configured Node backend on Send. For now there is no separate upload consent prompt beyond selecting a file and sending it. Do not expose this route publicly until authentication, privacy notice, stronger file validation, abuse protection and performance limits are reviewed.

## Dates and stale replies

The text chat route now inserts the **current Saudi date at request time** into its system context and instructs the model not to announce irrelevant historical dates. This reduces stale-date errors but does not guarantee factually correct answers without real-time retrieval.

## Test checklist

1. Arabic greeting and two consecutive natural-language replies **without MCQs**.
2. English conversation and switching language.
3. Verify reply to "What is today's date?" is consistent with system date in Riyadh.
4. Photo upload: check the selected vision model is installed and a real image description appears.
5. Short video: check FFmpeg installed, expect only 0s and 2s frame observations.
6. Audio file with CLAP **off**: expect an explicit warning that sound wasn't analyzed, while text conversation remains usable.
7. Audio file with CLAP **on** and deps present: expect relative sound-category matches. Have a professional verify any mechanical assumptions.
8. Delete attached media, case and vehicle; check history persists only on the same browser.
9. Review Node errors and resource consumption: on low-memory machines inference may be slow or fail.
10. `npm.cmd run check` validates JavaScript syntax; **it is not** a real end-to-end model test.

## URLs / references
- Ollama Qwen 3.5: https://ollama.com/library/qwen3.5
- Ollama Qwen3-VL: https://ollama.com/library/qwen3-vl
- CLAP model documentation: https://huggingface.co/docs/transformers/model_doc/clap
- FFmpeg: https://ffmpeg.org/
- PyTorch: https://pytorch.org/get-started/locally/
