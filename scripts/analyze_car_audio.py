#!/usr/bin/env python3
"""Optional *real* audio-model inference for Warshatak.

Requires ffmpeg, torch, numpy and transformers. Only produces tentative
audio-to-text similarity matches; it NEVER provides verified car fault labels.
Called by server/multimodal.js with an uploaded temporary file path.
"""
import json
import os
import subprocess
import sys

CAPTIONS = [
    ("engine_idling", "The sound of a car engine idling normally."),
    ("engine_start", "The sound of a car engine starting."),
    ("engine_clicking", "A car engine making repeated ticking or clicking sounds."),
    ("engine_knocking", "A running car engine making knocking sounds."),
    ("brake_squeal", "The high pitched squealing sound of car brakes."),
    ("brake_grinding", "Metallic grinding or scraping when a car is braking."),
    ("wheel_rumble", "A car wheel or tire making a low humming or rumbling sound."),
    ("suspension_clunk", "A car suspension making clunking noises over bumps."),
    ("belt_squeal", "A car engine belt making a high pitched squealing sound."),
    ("exhaust_rattle", "A metal rattling sound from a car exhaust."),
    ("wind_noise", "Wind noise heard while driving a car."),
    ("road_noise", "Normal road and tire noise while a car drives."),
    ("people_talking", "A person speaking close to a microphone."),
    ("traffic_noise", "Busy road traffic with passing cars."),
    ("horn", "A car horn honking."),
    ("unknown_noise", "A miscellaneous noise with no clear source."),
]


def main():
    if len(sys.argv) != 2:
        raise ValueError("Expected input audio/video path.")
    file_path = sys.argv[1]
    import numpy as np
    import torch
    from transformers import ClapModel, ClapProcessor

    # Decode ONLY the first 10 seconds, 48kHz mono, bounded raw PCM.
    process = subprocess.run([
        os.environ.get("FFMPEG_PATH", "ffmpeg"), "-hide_banner", "-loglevel", "error",
        "-i", file_path, "-vn", "-t", "10", "-ac", "1", "-ar", "48000",
        "-f", "s16le", "pipe:1"
    ], capture_output=True, timeout=45, check=True)
    if not process.stdout:
        raise RuntimeError("No decodable audio found in the clip.")
    waveform = np.frombuffer(process.stdout[:960_000], dtype="<i2").astype(np.float32) / 32768.0
    if len(waveform) < 4800:
        raise RuntimeError("Audio is too short to analyze.")

    model_name = os.environ.get("CLAP_MODEL", "laion/clap-htsat-unfused")
    processor = ClapProcessor.from_pretrained(model_name)
    model = ClapModel.from_pretrained(model_name)
    model.eval()
    inputs = processor(
        text=[text for _, text in CAPTIONS],
        audios=waveform,
        sampling_rate=48000,
        return_tensors="pt",
        padding=True
    )
    with torch.inference_mode():
        logits = model(**inputs).logits_per_audio[0].cpu().tolist()
    order = sorted(range(len(logits)), key=lambda i: logits[i], reverse=True)[:4]
    matches = [{
        "label": CAPTIONS[i][0],
        "description_en": CAPTIONS[i][1],
        "relative_similarity": round(float(logits[i]), 3)
    } for i in order]
    print(json.dumps({
        "model": model_name,
        "analyzed_seconds": round(len(waveform) / 48000, 2),
        "matches": matches,
        "warning": "Uncalibrated cross-modal similarity scores, not probabilities, faults or verified diagnoses."
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc)[:500], file=sys.stderr)
        sys.exit(1)
