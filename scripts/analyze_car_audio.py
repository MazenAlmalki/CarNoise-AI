#!/usr/bin/env python3
"""Local CLAP sound-event candidate retrieval for Warshatak.

Audio-text similarity, not a defect classifier or verified repair diagnosis.
Video platform links are not input to this script. Candidate captions are
human-authored, not labels extracted from any particular video.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

CAPTIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "car_audio_captions_v2.json"
SAMPLE_RATE = 48000
MAX_SECONDS = 20
WINDOW_SECONDS = 10

def load_candidates():
    items = json.loads(CAPTIONS_PATH.read_text(encoding="utf-8"))
    if len(items) < 40 or len({item["id"] for item in items}) != len(items):
        raise RuntimeError("Audio candidate library invalid")
    return items

def decode(file_path):
    # 20-second upper bound; ffmpeg decodes the first part of a clip locally.
    cmd = [
        os.environ.get("FFMPEG_PATH", "ffmpeg"),
        "-hide_banner", "-loglevel", "error", "-i", file_path,
        "-vn", "-t", str(MAX_SECONDS), "-ac", "1",
        "-ar", str(SAMPLE_RATE), "-f", "s16le", "pipe:1",
    ]
    process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             check=True, timeout=60)
    return process.stdout[:SAMPLE_RATE * MAX_SECONDS * 2]

def audio_windows(waveform):
    window = SAMPLE_RATE * WINDOW_SECONDS
    if len(waveform) <= window:
        return [(0.0, waveform)]
    parts = [(0.0, waveform[:window])]
    remaining = waveform[window:window * 2]
    if len(remaining) >= SAMPLE_RATE * 2:
        parts.append((float(WINDOW_SECONDS), remaining))
    return parts

def rank_matches(similarity_lists, items):
    # Max-over-windows allows a salient event in either portion to be noticed.
    # Not a calibrated confidence score: margins are descriptive only.
    scores = [max(float(row[i]) for row in similarity_lists)
              for i in range(len(items))]
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    best = scores[ranked[0]]
    runner_up = scores[ranked[1]]
    matches = []
    for index in ranked[:5]:
        item = items[index]
        matches.append({
            "label": item["id"],
            "category": item["category"],
            "description_en": item["caption_en"],
            "relative_similarity": round(scores[index], 3),
        })
    return {
        "matches": matches,
        "top_margin": round(best - runner_up, 3),
        "distinct_candidate_count": len(items),
        "sound_identified": False,
        "requires_confirmation": True,
        "warning": "Top matches are only the most similar of the listed descriptions, NOT probabilities, verified sound events, car defects, or diagnosis. A real sound may be absent from the library.",
    }

def main():
    if len(sys.argv) != 2:
        raise ValueError("Expected a local audio or video file path.")
    path = sys.argv[1]
    candidates = load_candidates()
    import numpy as np
    import torch
    from transformers import ClapModel, ClapProcessor

    pcm = decode(path)
    if not pcm:
        raise RuntimeError("Audio could not be decoded.")
    samples = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0
    if samples.size < SAMPLE_RATE:
        raise RuntimeError("Not enough audio to compare sound patterns.")
    # Silence has no meaningful event identity; don't return a best label.
    if float(np.sqrt(np.mean(samples * samples))) < 0.003:
        print(json.dumps({
            "model": os.environ.get("CLAP_MODEL", "laion/clap-htsat-unfused"),
            "analyzed_seconds": round(samples.size / SAMPLE_RATE, 1),
            "matches": [], "sound_identified": False, "requires_confirmation": True,
            "warning": "Audio is nearly silent. No acoustic identity inferred.",
        }, ensure_ascii=False))
        return

    model_name = os.environ.get("CLAP_MODEL", "laion/clap-htsat-unfused")
    processor = ClapProcessor.from_pretrained(model_name)
    model = ClapModel.from_pretrained(model_name)
    model.eval()
    # Avoid excessive CPU threads and memory pressure on small laptops.
    torch.set_num_threads(min(4, os.cpu_count() or 2))
    labels = [item["caption_en"] for item in candidates]
    comparisons = []
    with torch.inference_mode():
        for offset, window in audio_windows(samples):
            inputs = processor(
                text=labels, audios=window,
                sampling_rate=SAMPLE_RATE,
                return_tensors="pt", padding=True
            )
            values = model(**inputs).logits_per_audio[0].float().cpu().tolist()
            comparisons.append(values)
    result = rank_matches(comparisons, candidates)
    result.update({
        "model": model_name,
        "analyzed_seconds": round(samples.size / SAMPLE_RATE, 2),
        "analyzed_windows": len(comparisons),
        "max_audio_seconds": MAX_SECONDS,
    })
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc)[:500], file=sys.stderr)
        sys.exit(1)
