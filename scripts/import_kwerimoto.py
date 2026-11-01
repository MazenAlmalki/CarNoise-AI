#!/usr/bin/env python3
"""Import the KweriMoto publisher's manifest into a locally generated Warshatak index.

Only downloads manifest.csv, not audio assets. No guesswork and no generated fake rows.
Usage: python scripts/import_kwerimoto.py
"""
from __future__ import annotations

import argparse
import csv
import json
import pathlib
import sys
import urllib.error
import urllib.request
from collections import Counter

SOURCE = "https://huggingface.co/datasets/rayyyyy007/kwerimoto-engine-sounds/resolve/main/manifest.csv"
SOURCE_PAGE = "https://huggingface.co/datasets/rayyyyy007/kwerimoto-engine-sounds"
COLUMNS = {"file_name", "label", "split", "source_dataset", "synthetic", "duration_s", "vehicle_tag"}
ALLOWED_LABELS = {"healthy", "engine_knock", "misfire"}
ALLOWED_SPLITS = {"train", "validation", "test", "real_test"}

def prepare_rows(rows):
    items, seen = [], set()
    for i, row in enumerate(rows, 1):
        if not COLUMNS.issubset(row):
            raise ValueError("Manifest missing columns: " + ", ".join(sorted(COLUMNS - row.keys())))
        fname = row["file_name"].strip()
        if not fname or fname in seen:
            raise ValueError(f"Missing or duplicate path on row {i}: {fname!r}")
        seen.add(fname)
        label, split = row["label"].strip(), row["split"].strip()
        if label not in ALLOWED_LABELS or split not in ALLOWED_SPLITS:
            raise ValueError(f"Unrecognized label/split on row {i}: {label}/{split}")
        synthetic = str(row["synthetic"]).lower() == "true"
        if str(row["synthetic"]).lower() not in {"true", "false"}:
            raise ValueError(f"Invalid synthetic flag at row {i}")
        try:
            duration = float(row["duration_s"])
        except ValueError as exc:
            raise ValueError(f"Invalid duration at row {i}") from exc
        if duration <= 0 or duration > 11:
            raise ValueError(f"Unexpected clip duration at row {i}")
        vehicle_tag = row["vehicle_tag"].strip()
        source_dataset = row["source_dataset"].strip()
        # 'real' means not synthetically mixed; it DOES NOT mean car-only or a verified fault.
        # Publisher notes most AudioSet clips are not explicitly vehicle-tagged.
        audit_flag = (
            "synthetic_audio" if synthetic else
            "vehicle_not_verified" if source_dataset == "audioset" and vehicle_tag != "car" else
            "fault_unverified"
        )
        items.append({
            "id": f"KWERI-{i:04d}",
            "source_file": fname,
            "label_from_publisher": label,
            "split": split,
            "source_dataset": source_dataset,
            "source_recording": row.get("source_recording", ""),
            "original_file": row.get("original_file", ""),
            "recording_group": row.get("group", ""),
            "synthetic": synthetic,
            "vehicle_tag": vehicle_tag,
            "duration_seconds": duration,
            "source_sha256": row.get("sha256", ""),
            "audit_flag": audit_flag,
            "mechanic_verified": False,
            "fault_diagnosis_confirmed": False,
            "audio_in_this_repository": False,
            "license_status": "mixed_original_ownership_manual_review_required",
            "source_dataset_page": SOURCE_PAGE,
        })
    return items

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=pathlib.Path, help="Use previously downloaded local manifest.csv")
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("data/imported"))
    args = parser.parse_args()

    if args.manifest:
        print("Reading:", args.manifest)
        with args.manifest.open(encoding="utf-8-sig", newline="") as f:
            items = prepare_rows(csv.DictReader(f))
    else:
        print("Downloading publisher manifest (metadata only):", SOURCE)
        try:
            with urllib.request.urlopen(urllib.request.Request(SOURCE, headers={"User-Agent": "Warshatak-research/1.0"}), timeout=60) as r:
                text = r.read().decode("utf-8-sig")
        except (urllib.error.URLError, TimeoutError) as exc:
            print("Download failed. Download manifest.csv manually from the dataset page and retry --manifest PATH.", file=sys.stderr)
            print(str(exc), file=sys.stderr)
            sys.exit(1)
        import io
        items = prepare_rows(csv.DictReader(io.StringIO(text)))

    if len(items) != 1067:
        print(f"WARNING: source version has {len(items)} clips, expected 1,067. Review before using.", file=sys.stderr)

    args.output.mkdir(parents=True, exist_ok=True)
    output = args.output / "kwerimoto_index.jsonl"
    with output.open("w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    label_counts = Counter(x["label_from_publisher"] for x in items)
    splits = Counter(x["split"] for x in items)
    flags = Counter(x["audit_flag"] for x in items)
    report = {
        "dataset": SOURCE_PAGE,
        "rows_indexed": len(items),
        "labels": dict(label_counts),
        "splits": dict(splits),
        "audit_flags": dict(flags),
        "contains_audio": False,
        "mechanic_verified_count": 0,
        "use_for": "exploratory_audio_similarity_and_evaluation_only",
        "do_not_use_for": "confirmed_diagnostic_training_or_commercial_audio_redistribution_without_rights_review",
    }
    (args.output / "kwerimoto_audit.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print("Created:", output)

if __name__ == "__main__":
    main()
