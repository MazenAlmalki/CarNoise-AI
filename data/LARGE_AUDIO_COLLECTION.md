# Warshatak: 1,000+ Audio Reference Expansion

## What has been added to this repository
- `data/large_audio_dataset_catalog.json`: publisher-reported dataset counts, original URLs, provenance, rights, validation and intended role.
- `scripts/import_kwerimoto.py`: metadata-only importer for the original **1,067-row** KweriMoto manifest. It validates record IDs, source paths, label/split values and marks quality caveats; outputs JSONL and audit summary in `data/imported/`.
- Existing `data/audio_sources_v1.json`: individually linked sample recordings.
- Existing `data/source_comments_v1.json`: source-grounded automotive guidance notes, **not comments attached to the audio**.

## Getting the 1,067 actual metadata rows on your machine

```powershell
cd path\to\CarNoise-AI
python scripts/import_kwerimoto.py
```

Files generated locally:
- `data/imported/kwerimoto_index.jsonl` — one record per published audio file
- `data/imported/kwerimoto_audit.json` — source counts / warnings

If the manifest cannot be reached, visit [KweriMoto](https://huggingface.co/datasets/rayyyyy007/kwerimoto-engine-sounds), download `manifest.csv`, and run:

```powershell
python scripts/import_kwerimoto.py --manifest ".\manifest.csv"
```

**The importer downloads only metadata, not audio.** I could not access the upstream manifest file contents in this environment, so the 1,067 rows have NOT been imported or verified row-by-row in this repo. This number is from the publisher's live dataset card.

## Obtaining actual audio (only after reviewing rights)
The publisher documents `huggingface_hub.snapshot_download("rayyyyy007/kwerimoto-engine-sounds", repo_type="dataset")`, which downloads underlying clips, but **the dataset is labeled "other" and contains third-party YouTube recordings and material with no clear audio license**. Do not redistribute the files into a public GitHub repo or a commercial product before verifying each source's rights.

For a more clearly licensed but **synthetic and noncommercial** reference corpus, see Robin Doerfler's 5,935 procedural engine recordings (CC BY-NC 4.0). It is roughly 24.47 GB and is **not** a diagnosed-fault dataset.

## Known restrictions
- None of these datasets make 1,000+ mechanic-verified failure labels.
- KweriMoto contains both real and synthetic sound. Some AudioSet knock examples cannot be confirmed to be automobiles, much less a diagnosed repair.
- OtoMobile has 65 fault-labeled examples selected using mechanic-provided/consulted diagnosis, but access is restricted.
- Audio similarity is NOT a fault probability. A model must support `unknown` and `ambiguous` results.
- Separate the reference clips from `data/knowledge_seed_v1.json` automotive explanations; only join them where a technician has verified relevance.
- Store rights/provenance/sha256 and hold out entire recording groups for evaluation.

## Practical next phase
1. Run importer, review audit output, and exclude synthetic / unverified vehicle recordings when testing real-car audio matching.
2. Secure permissions to use a subset of audio in Warshatak; download them to a local ignored folder.
3. Use an audio embedding model such as CLAP to build an index of licensed reference clips.
4. Return top-k similar sounds + uncertainty (not inferred confirmed faults), and ground the assistant's next-step explanation in vetted automotive information.
5. Validate with mechanic-confirmed recordings before providing user-facing fault identification.

### Original sources
- https://huggingface.co/datasets/rayyyyy007/kwerimoto-engine-sounds
- https://huggingface.co/datasets/rdoerfler/procedural-engine-sounds
- https://zenodo.org/records/18777405
- https://zenodo.org/records/3382945
- https://research.google.com/audioset/
