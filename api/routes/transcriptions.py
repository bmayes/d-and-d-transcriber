from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
import os

from ..database import get_db, TranscriptionDB
from ..models import TranscriptionResponse, TranscriptionDetailResponse, TranscriptionListResponse
from ..config import ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES
from ..storage import save_upload
from ..worker.job import process_transcription
from ..worker.progress import Stage, Status

router = APIRouter()

@router.post("", response_model=TranscriptionResponse, status_code=202)
async def create_transcription(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    speaker_count: int = Form(...),
    db: Session = Depends(get_db)
):
    # Validate extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="unsupported_format")
    
    # Validate size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="too_large")
    
    if speaker_count < 1 or speaker_count > 10:
        raise HTTPException(status_code=400, detail="invalid_speakers")

    job_id = str(uuid.uuid4())
    
    # Save file
    file_path = await save_upload(job_id, file_ext, file)
    
    # Insert to DB
    new_job = TranscriptionDB(
        id=job_id,
        created_at=datetime.now(timezone.utc).isoformat(),
        filename=file.filename,
        status=Status.PROCESSING.value,
        stage=Stage.UPLOADING.value,
        speaker_count=speaker_count
    )
    db.add(new_job)
    db.commit()
    
    # Fire background task
    background_tasks.add_task(process_transcription, job_id, file_path, speaker_count)
    
    return TranscriptionResponse(job_id=job_id, status=Status.PROCESSING.value)

@router.get("/{id}", response_model=TranscriptionDetailResponse)
def get_transcription(id: str, db: Session = Depends(get_db)):
    job = db.query(TranscriptionDB).filter(TranscriptionDB.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Not found")
    
    preview = None
    if job.transcript_txt:
        lines = job.transcript_txt.split('\n')
        preview = '\n'.join(lines[:10]) + ('...' if len(lines) > 10 else '')

    return TranscriptionDetailResponse(
        job_id=job.id,
        filename=job.filename,
        created_at=job.created_at,
        status=job.status,
        stage=job.stage,
        transcript_preview=preview,
        total_lines=job.total_lines
    )

@router.get("/{id}/download")
def download_transcription(id: str, format: str = "txt", db: Session = Depends(get_db)):
    job = db.query(TranscriptionDB).filter(TranscriptionDB.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Not found")
    if job.status != Status.COMPLETE.value:
        raise HTTPException(status_code=400, detail="Transcription not complete")
    
    if format == "txt":
        content = job.transcript_txt
        media_type = "text/plain"
        ext = "txt"
    elif format == "json":
        content = job.transcript_json
        media_type = "application/json"
        ext = "json"
    elif format == "srt":
        content = job.transcript_srt
        media_type = "text/plain"
        ext = "srt"
    else:
        raise HTTPException(status_code=400, detail="Invalid format")
    
    if not content:
        raise HTTPException(status_code=404, detail="Transcript content missing")

    filename = f"{os.path.splitext(job.filename)[0]}.{ext}"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return Response(content=content, media_type=media_type, headers=headers)

@router.get("", response_model=list[TranscriptionListResponse])
def list_transcriptions(db: Session = Depends(get_db)):
    jobs = db.query(TranscriptionDB).order_by(TranscriptionDB.created_at.desc()).all()
    return [
        TranscriptionListResponse(
            job_id=j.id,
            created_at=j.created_at,
            filename=j.filename,
            status=j.status,
            total_lines=j.total_lines
        ) for j in jobs
    ]

@router.delete("/{id}", status_code=204)
def delete_transcription(id: str, db: Session = Depends(get_db)):
    job = db.query(TranscriptionDB).filter(TranscriptionDB.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(job)
    db.commit()
    return Response(status_code=204)
