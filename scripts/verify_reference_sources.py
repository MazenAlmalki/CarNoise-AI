#!/usr/bin/env python3
"""Verify existing reference PCM against supplied originals. No acoustic review/training."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess


def pcm(file, start=None, duration=None):
    command = ['ffmpeg', '-v', 'error']
    if start is not None:
        command += ['-ss', str(start)]
    command += ['-i', str(file)]
    if duration is not None:
        command += ['-t', str(duration)]
    command += ['-ac', '1', '-ar', '16000', '-f', 's16le', 'pipe:1']
    return subprocess.check_output(command, timeout=45)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('videos', nargs=2, type=Path)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent.parent / 'data/uploaded_audio_references'
    records = json.loads((directory / 'manifest.json').read_text())['records']
    expected = {r['source_sha256'] for r in records}
    supplied = {hashlib.sha256(p.read_bytes()).hexdigest(): p for p in args.videos}
    if set(supplied) != expected:
        raise ValueError('Supply the two original source videos with the recorded hashes.')
    results = []
    for record in records:
        reference = directory / record['file']
        if hashlib.sha256(reference.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError('Reference hash mismatch: ' + record['id'])
        original = pcm(supplied[record['source_sha256']], record['start_seconds'], record['end_seconds']-record['start_seconds'])
        if original != pcm(reference):
            raise ValueError('Source window differs from reference PCM: ' + record['id'])
        results.append({'id': record['id'], 'source_sha256': record['source_sha256'], 'start_seconds': record['start_seconds'], 'end_seconds': record['end_seconds'], 'pcm_equal': True})
    print(json.dumps({'sources': len(supplied), 'references': results, 'acoustic_review': 'not_performed', 'recognition_accuracy': None}, indent=2))


if __name__ == '__main__':
    main()
