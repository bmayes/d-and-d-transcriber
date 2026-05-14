from sqlalchemy import create_engine, Column, String, Integer, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import DB_PATH
import os

# Ensure the data directory exists
os.makedirs(DB_PATH.parent, exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class TranscriptionDB(Base):
    __tablename__ = "transcriptions"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    status = Column(String, nullable=False)
    stage = Column(String, nullable=False)
    speaker_count = Column(Integer, nullable=True)
    transcript_txt = Column(Text, nullable=True)
    transcript_json = Column(Text, nullable=True)
    transcript_srt = Column(Text, nullable=True)
    total_lines = Column(Integer, nullable=True)
    error_detail = Column(Text, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
