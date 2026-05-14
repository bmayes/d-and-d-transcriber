import os
from pathlib import Path

PORT = 16767
MAX_UPLOAD_BYTES = 100 * 1024 * 1024   # 100 MB
WHISPER_MODEL = "turbo"

WHISPER_MODEL_MAPPING = {
    "tiny": "mlx-community/whisper-tiny-mlx",
    "base": "mlx-community/whisper-base-mlx",
    "small": "mlx-community/whisper-small-mlx",
    "medium": "mlx-community/whisper-medium-mlx",
    "large": "mlx-community/whisper-large-v3-mlx",
    "turbo": "mlx-community/whisper-large-v3-turbo",
}
DATA_DIR = Path(__file__).parent.parent / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "transcriptions.db"
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".mp4"}
CORS_ORIGINS = ["http://localhost:3000"]  # Next.js dev server
