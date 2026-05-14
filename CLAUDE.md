# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`d-and-d-transcriber` is a drag-and-drop web app for transcribing audio files with automatic speaker identification. It has two services:

- **`api/`** — FastAPI backend: handles uploads, runs transcription and diarization as background jobs, stores results in SQLite
- **`fe/`** — Next.js frontend: drag-and-drop upload, live progress polling, transcript history, download in TXT/JSON/SRT

## Stack

**Backend (`api/`)**
- **Language:** Python 3.11+
- **Framework:** FastAPI + uvicorn
- **Transcription:** `mlx-whisper` (Apple Silicon only) — model: `mlx-community/whisper-large-v3-turbo`
- **Diarization:** SpeechBrain ECAPA-TDNN (`speechbrain/spkrec-ecapa-voxceleb`)
- **Database:** SQLite via SQLAlchemy
- **Audio:** system `ffmpeg`

**Frontend (`fe/`)**
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, shadcn/ui
- **Package manager:** pnpm

## Directory Layout

```
api/
  main.py              # FastAPI app entrypoint
  config.py            # constants (port, model, limits)
  database.py          # SQLAlchemy models + session
  models.py            # Pydantic response schemas
  storage.py           # upload save/delete
  routes/
    transcriptions.py  # all API endpoints
  worker/
    job.py             # background transcription + diarization pipeline
    progress.py        # DB status updates
  diarizer/
    base.py            # abstract diarizer interface
    speechbrain_impl.py
fe/
  app/                 # Next.js App Router pages
  components/          # React components
  lib/                 # API client + shared types
scripts/
  test_whisper.py      # standalone CLI for testing transcription/diarization
```

## Setup & Running

```bash
./install.sh   # one-time setup (checks prereqs, creates venv, installs deps)
./run.sh       # starts both backend (port 16767) and frontend (port 3000)
```

Manual:
```bash
# Backend
source .venv/bin/activate
python -m uvicorn api.main:app --reload --port 16767

# Frontend
cd fe && pnpm dev
```

## Key Config

All tunable constants are in `api/config.py`:
- `WHISPER_MODEL` — shorthand key into `WHISPER_MODEL_MAPPING` (default: `"turbo"`)
- `MAX_UPLOAD_BYTES` — 100 MB
- `ALLOWED_EXTENSIONS` — `.mp3 .wav .m4a .flac .ogg .webm .mp4`
- `PORT` — 16767

## Runtime Data

`data/` is gitignored. It contains:
- `data/transcriptions.db` — SQLite database
- `data/uploads/` — temporary audio files (deleted after processing)

`pretrained_models/` is gitignored — SpeechBrain downloads weights here on first run.
