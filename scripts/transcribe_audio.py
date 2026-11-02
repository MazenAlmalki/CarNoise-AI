#!/usr/bin/env python3
"""Optional LOCAL speech transcription. Never guesses vehicle faults from sound.

Install: python -m pip install faster-whisper
Whisper model files download to the user's local cache on first use.
"""
import json
import os
import sys

def main():
    if len(sys.argv) != 3:
        raise ValueError("Expected audio/video path and UI language.")
    file_path, ui_language = sys.argv[1:]
    from faster_whisper import WhisperModel
    model_name = os.environ.get("WHISPER_MODEL", "base")
    device = "cpu"
    model = WhisperModel(model_name, device=device, compute_type="int8", cpu_threads=4)
    language = "ar" if ui_language == "ar" else None
    segments, info = model.transcribe(
        file_path,
        language=language,
        beam_size=3,
        best_of=2,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 350},
        condition_on_previous_text=False,
        hallucination_silence_threshold=1.0,
        without_timestamps=False,
    )
    accepted = []
    for segment in segments:
        content = segment.text.strip()
        # Silence and uncertain ASR must never be treated as a confirmed transcription.
        if not content or segment.no_speech_prob > 0.6 or segment.avg_logprob < -1.05:
            continue
        accepted.append(content)
        if sum(len(x) for x in accepted) > 1000:
            break
    transcript = " ".join(accepted).strip()[:1000]
    print(json.dumps({
        "type": "speech_transcription",
        "model": model_name,
        "language": info.language,
        "text": transcript,
        "hasRecognizedSpeech": bool(transcript),
        "limitations": "Automated transcription can mishear words or hallucinate; verify important phrases with the user. A transcript is NOT vehicle diagnosis."
    }, ensure_ascii=False))

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error)[:400], file=sys.stderr)
        sys.exit(1)
