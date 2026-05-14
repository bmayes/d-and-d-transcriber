from pydantic import BaseModel
from typing import Optional, List

class TranscriptionResponse(BaseModel):
    job_id: str
    status: str

class TranscriptionDetailResponse(BaseModel):
    job_id: str
    filename: str
    created_at: str
    status: str
    stage: str
    transcript_preview: Optional[str] = None
    total_lines: Optional[int] = None

class TranscriptionListResponse(BaseModel):
    job_id: str
    created_at: str
    filename: str
    status: str
    total_lines: Optional[int] = None
