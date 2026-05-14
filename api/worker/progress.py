from enum import Enum
from ..database import SessionLocal, TranscriptionDB

class Stage(str, Enum):
    UPLOADING = "uploading"
    TRANSCRIBING = "transcribing"
    IDENTIFYING_SPEAKERS = "identifying_speakers"
    DONE = "done"

class Status(str, Enum):
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

def update_job_stage(job_id: str, stage: Stage, status: Status = Status.PROCESSING, error_detail: str = None, total_lines: int = None, transcripts: dict = None):
    db = SessionLocal()
    try:
        job = db.query(TranscriptionDB).filter(TranscriptionDB.id == job_id).first()
        if job:
            job.stage = stage.value
            job.status = status.value
            if error_detail is not None:
                job.error_detail = error_detail
            if total_lines is not None:
                job.total_lines = total_lines
            if transcripts:
                job.transcript_txt = transcripts.get("txt")
                job.transcript_json = transcripts.get("json")
                job.transcript_srt = transcripts.get("srt")
            db.commit()
    finally:
        db.close()
