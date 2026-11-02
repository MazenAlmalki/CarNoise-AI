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


## Check which local models are actually installed

With the Node server running, open `http://localhost:3000/api/model-status`. It queries **local Ollama** and returns whether `CHAT_MODEL` and `VISION_MODEL` are installed. If `ollamaReachable:false`, start Ollama first. Remote text providers are not checked by this local-only endpoint.

The visual model request uses `keep_alive:0` to unload after visual inference and reduce simultaneous memory pressure on low-RAM laptops. Running two models in sequence can still be slow. An attached photo/video/audio file can also be submitted without a written description.


## V5.6 — Audio and video without CLAP (November 2, 2026)

You do **not** need PyTorch/CLAP to upload audio anymore. By default, Warshatak uses FFmpeg locally to decode up to 12 seconds of audio and estimates volume, temporal variation and rough high/low frequency content. This does **not** identify a horn, squeal, bearing, or any particular faulty car component. The AI must say when it only has these basic signal features and ask one relevant question about the sound. Optional CLAP remains available with `ENABLE_AUDIO_CLAP=1`, but may overwhelm a Windows laptop with 8 GB RAM.

**FFmpeg is required for the built-in lightweight audio path and video frame extraction.** On Windows 11, open a separate PowerShell terminal and check:

```powershell
ffmpeg -version
```

If not found, use Windows Package Manager if available:

```powershell
winget install --id Gyan.FFmpeg -e --source winget
```

Close and reopen VS Code after installing so its terminal PATH refreshes. Verify `ffmpeg -version`, then restart `npm.cmd run dev`. If winget is unavailable, install FFmpeg via its official download instructions and add the binary directory to PATH. Do not use untrusted binary mirrors.

Check readiness in browser: `http://localhost:3000/api/media-status` returns `ffmpegReady` and `waveformAnalysisReady`; these must be `true` for basic audio processing. `audioClapEnabled:false` is **expected** and not a blocking error for waveform processing. `visionModelConfigured` is only a name, not proof it is downloaded; `/api/model-status` checks Ollama model tags.

**How to use:** Click Attach, choose audio/video/image (up to 25 MB), enter a message if you like, and Send. You can now attach or record a new clip **in an existing conversation** too. The clip is temporarily uploaded to the backend for local analysis, then the chat receives explicit observations with limits. A video uses at most two still frames and any audio waveform it can decode; frame observations may be slow or fail with low RAM. On errors, the UI should tell you the recording was **not analyzed**. Only the most recent attachment is shown with the conversation; older attachments may remain stored locally until that case is deleted.

**Testing:** send a short recorded audio clip and ask what was observed. A waveform-only result must not claim it recognized the noise. Then send a short car video with audible sound; verify visual/frame limitations and/or waveform description. Never record while driving or in a dangerous position.
