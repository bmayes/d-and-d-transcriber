# Product Requirements Document: Local Audio Transcriber

> **Note:** The `d-and-d` in the project name stands for **Drag-and-Drop**. This software is explicitly **not** built specifically for Dungeons and Dragons or tabletop games. It is a general-purpose tool.

## Overview
- **The Problem:** We need a simple, private way to transcribe audio files without relying on expensive cloud APIs or complex CLI tools.
- **The Solution:** A web app with a simple UI that allows users to drag-and-drop audio files. The Next.js frontend sends the file to a FastAPI backend which uses the local `mlx-whisper` model to generate transcripts and `speechbrain` for speaker diarization (with `pyannote` as the planned upgrade).
- **Unique Selling Proposition:** An **open-source**, completely local processing tool for privacy, zero recurring costs, and an extremely simple drag-and-drop user interface featuring a distinctive yellow star target.

## Features & Requirements

### Core Features
- **The Yellow Star UI:** The core interface features a prominent yellow star. Users drag and drop an audio file directly onto this star.
- **Format Validation:** Upon dropping a file, the system immediately checks if the audio format is supported. If unsupported, it pushes back a simple, clear error message to the user explaining it cannot be processed.
- **Speaker Prompting:** When a supported file is dropped (or during the intake process), the system prompts the user asking how many speakers are in the audio file. The user can enter this number to assist with diarization.
- **Backend Processing:** Supported files are sent to a backend FastAPI endpoint for intake and processing.
- **Local Transcription & Diarization:** Uses `mlx-whisper` (turbo model by default) running locally on Apple Silicon to transcribe audio. Speaker diarization uses `speechbrain` ECAPA-TDNN embeddings + agglomerative clustering. `pyannote` is the planned replacement; a `Diarizer` abstraction isolates the swap to one file.
- **Transcript Export:** Ability to view, copy, and download the resulting transcript in TXT, JSON, or SRT format. SRT embeds speaker labels as `[Speaker N]: text` within subtitle content blocks.
- **Transcription History:** The backend stores past transcriptions in SQLite. Users can view a list of previous jobs in a sidebar, reload any transcript, and delete entries.

### Technical Requirements
- **Frontend/UI:** Next.js App Router web app. Implements the yellow star drag-and-drop target, format validation, speaker count prompt, progress states, transcript view, and history sidebar. Configures backend URL via `NEXT_PUBLIC_TRANSCRIBE_API_URL` (default: `http://localhost:16767`).
- **Backend/API:** FastAPI. **Must run natively (bare-metal) on macOS on port `16767`** — Docker is explicitly avoided so MLX has direct access to the Apple Silicon GPU/Neural Engine. File upload cap: **100 MB** (a single `MAX_UPLOAD_BYTES` constant for easy adjustment). Jobs are processed asynchronously; frontend polls for status.
- **Database:** SQLite for persisting transcription history and job metadata.
- **AI Processing:** Python 3.11 with `mlx-whisper` (turbo default) and `speechbrain` for diarization. Progress is reported as discrete stages (`uploading → transcribing → identifying speakers → done`) — mlx-whisper does not emit per-segment callbacks so granular 0–100% is not available in V1.
- **Error handling:** If the backend crashes mid-transcription, the job is marked `failed` and a clean error is surfaced to the frontend. No automatic retry or partial recovery in V1.
- **System Dependencies:** Requires `ffmpeg` for audio decoding.
- **Hardware Target:** Apple Silicon Macs (M1/M2/M3/M4). The app is explicitly designed to be run locally on these machines to take advantage of their unified memory and ML processing capabilities.

### Out of Scope (For Now)
- Real-time/live microphone transcription.
- Cloud storage, user accounts, or multi-user support.
- Speaker renaming / inline transcript editing.
- Multi-file batch processing.

## Target Audience
- Anyone needing a private, offline transcription tool with a simple GUI.
- Professionals, journalists, or students who need secure, local transcription for interviews, meetings, or notes.
- **Apple Silicon Owners:** Users with M-series Macs looking for an open-source utility that maximizes their local hardware without paying for cloud transcription.

## API Contract (FastAPI, port 16767)

```
POST /api/transcriptions
  multipart/form-data:
    file: <audio>  (max 100 MB — MAX_UPLOAD_BYTES constant)
    speaker_count: int (1–10)
  -> 202 { job_id, status: "processing" }
  -> 400 { error: "unsupported_format" | "too_large" | "invalid_speakers" }
  -> 500 { error: "transcription_failed", detail }

GET /api/transcriptions/{id}
  -> { job_id, status: "processing"|"complete"|"failed",
       stage: "uploading"|"transcribing"|"identifying_speakers"|"done",
       transcript_preview, total_lines }
  (frontend polls until status != "processing")

GET /api/transcriptions/{id}/download?format=txt|json|srt
  -> transcript as file attachment

GET /api/transcriptions
  -> [{ job_id, created_at, filename, status, total_lines }]

DELETE /api/transcriptions/{id}
  -> 204 No Content
```

## Open Questions & Future Enhancements
- Should we cap max duration separately from file size? (A low-bitrate 3-hour file could be under 100 MB.)
- Should we add CPU/GPU hardware acceleration toggles?
- Speaker renaming / inline transcript editing — future or V1?
