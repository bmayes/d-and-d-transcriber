# Drag and Drop (aka D-and-D) Transcriber

A drag-and-drop web app for transcribing audio files with automatic speaker identification. Upload a recording, specify how many speakers are in it, and get a labeled transcript back in TXT, JSON, or SRT format.

Built for Apple Silicon using [mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper) for fast on-device transcription and [SpeechBrain](https://speechbrain.github.io/) for speaker diarization.

## Requirements

- Apple Silicon Mac (M1 or later) — mlx-whisper is Apple Silicon only
- Python 3.11+
- Node.js 18+
- [pnpm](https://pnpm.io/)
- [ffmpeg](https://ffmpeg.org/)

## Quick Start

```bash
./install.sh   # one-time setup
./run.sh       # start the app
```

Then open [http://localhost:3000](http://localhost:3000).

## Features

- Drag-and-drop audio upload
- Speaker identification — label each voice in the transcript
- Download transcripts as TXT, JSON, or SRT
- Transcription history with re-download

## Supported Formats

`.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.webm`, `.mp4` — up to 100 MB

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLite |
| Transcription | mlx-whisper (whisper-large-v3-turbo) |
| Diarization | SpeechBrain (ECAPA-TDNN) |

## Manual Setup

If you prefer to set up manually instead of using the scripts:

```bash
# Python backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Node frontend
cd fe && pnpm install

# Run backend (from project root, venv active)
python -m uvicorn api.main:app --reload --port 16767

# Run frontend (in a second terminal)
cd fe && pnpm dev
```
