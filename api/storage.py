import os
import shutil
from .config import UPLOADS_DIR

os.makedirs(UPLOADS_DIR, exist_ok=True)

async def save_upload(job_id: str, file_ext: str, upload_file) -> str:
    """Save an uploaded file to disk. Return the saved file path."""
    file_path = UPLOADS_DIR / f"{job_id}{file_ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return str(file_path)

def delete_upload(file_path: str):
    """Delete an uploaded file from disk."""
    if os.path.exists(file_path):
        os.remove(file_path)
