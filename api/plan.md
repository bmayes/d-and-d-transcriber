# API — Backend Implementation Plan

For product requirements and the authoritative API contract, see [`../prd.md`](../prd.md).

## Directory Structure

```
api/
  main.py               # FastAPI app, CORS, lifespan startup
  config.py             # Constants: port, MAX_UPLOAD_BYTES, model name, data paths
  database.py           # SQLite connection, schema creation on startup
  models.py             # Pydantic request/response schemas + DB row types
  storage.py            # File save/delete helpers (uploads + data dir)
  routes/
    transcriptions.py   # All /api/transcriptions endpoints
  worker/
    job.py              # Background job: transcribe → diarize → persist
    progress.py         # Stage enum + DB update helper
  diarizer/
    base.py             # Abstract Diarizer base class + Segment dataclass
    speechbrain_impl.py # Current implementation (adapted from scripts/test_whisper.py)
```

## Config (`config.py`)

```python
PORT = 16767
MAX_UPLOAD_BYTES = 100 * 1024 * 1024   # 100 MB — change here to adjust cap
WHISPER_MODEL = "turbo"
DATA_DIR = Path(__file__).parent.parent / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "transcriptions.db"
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".mp4"}
CORS_ORIGINS = ["http://localhost:3000"]  # Next.js dev server
```

`data/` is gitignored. Created on startup if absent.

## SQLite Schema

Single table. All transcript formats stored as text columns to avoid a separate file layer.

```sql
CREATE TABLE IF NOT EXISTS transcriptions (
    id           TEXT PRIMARY KEY,        -- UUID4
    created_at   TEXT NOT NULL,           -- ISO8601 UTC
    filename     TEXT NOT NULL,           -- original uploaded filename
    status       TEXT NOT NULL,           -- processing | complete | failed
    stage        TEXT NOT NULL,           -- uploading | transcribing | identifying_speakers | done
    speaker_count INTEGER,
    transcript_txt  TEXT,
    transcript_json TEXT,                 -- JSON array of Segment objects
    transcript_srt  TEXT,
    total_lines  INTEGER,
    error_detail TEXT
);
```

## Async Job Design

FastAPI's `BackgroundTasks` is sufficient for V1 — no external queue needed.

```
POST /api/transcriptions
  1. Validate file (extension, size)
  2. Save to UPLOADS_DIR/{job_id}.{ext}
  3. INSERT row: status=processing, stage=uploading
  4. Return 202 { job_id, status: "processing" }
  5. Fire background task → worker/job.py

Background task:
  1. Update stage=transcribing
  2. mlx_whisper.transcribe(path, path_or_hf_repo=model) → segments
  3. Update stage=identifying_speakers
  4. Diarizer.transcribe(path, segments, speaker_count) → labeled segments
  5. Render txt / json / srt from labeled segments
  6. UPDATE row: status=complete, stage=done, transcripts, total_lines
  7. Delete upload file (no longer needed)

  On any exception:
  UPDATE row: status=failed, error_detail=str(e)
```

GET polling returns the current `status` and `stage` on every request until status is `complete` or `failed`.

## Diarizer Abstraction

Swapping SpeechBrain for pyannote means creating a new class behind this interface — zero API or frontend changes.

```python
# diarizer/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class Segment:
    speaker: str   # "Speaker 1", "Speaker 2", …
    start: float   # seconds
    end: float
    text: str

class Diarizer(ABC):
    @abstractmethod
    def transcribe(self, audio_path: str, segments: list[dict], num_speakers: int) -> list[Segment]:
        ...
```

`speechbrain_impl.py` is a direct adaptation of `scripts/test_whisper.py` — the `diarize()`, `get_embeddings()`, and `cluster_speakers()` functions move in essentially unchanged.

## Transcript Rendering

Three formats generated once at job completion, stored as text columns:

- **TXT** — `[HH:MM:SS] Speaker N:\n  text` blocks (current script format)
- **JSON** — `[{ "speaker": "Speaker 1", "start": 0.0, "end": 3.2, "text": "..." }, …]`
- **SRT** — standard SRT blocks; speaker label embedded as `[Speaker N]: text`

```
1
00:00:01,000 --> 00:00:04,500
[Speaker 1]: Yeah so I think the issue is—

2
00:00:04,800 --> 00:00:07,100
[Speaker 2]: Right, exactly.
```

## CORS

Allow `http://localhost:3000` in development. `CORS_ORIGINS` in `config.py` can be extended for any deployed frontend URL.

## Dependencies (additions to `requirements.txt`)

```
fastapi
uvicorn[standard]
python-multipart    # multipart/form-data uploads
mlx-whisper
speechbrain
torch
scikit-learn        # AgglomerativeClustering
numpy
```

## Open Questions

- Should uploads be deleted immediately after processing, or retained for a configurable window?
- When the history sidebar deletes a job (`DELETE /api/transcriptions/{id}`), should we also hard-delete the SQLite row, or soft-delete with a `deleted_at` column?
- Do we need a startup check that `ffmpeg` is installed, with a clear error if missing?
