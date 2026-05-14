import traceback
import json
import logging
import mlx_whisper

logger = logging.getLogger(__name__)
from .progress import update_job_stage, Stage, Status
from ..config import WHISPER_MODEL, WHISPER_MODEL_MAPPING
from ..storage import delete_upload
from ..diarizer.speechbrain_impl import SpeechBrainDiarizer

def format_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def render_transcripts(labeled_segments) -> dict:
    txt_lines = []
    srt_lines = []
    json_list = []
    
    prev_speaker = None
    for i, seg in enumerate(labeled_segments):
        # TXT
        if seg.speaker != prev_speaker:
            h = int(seg.start // 3600)
            m = int((seg.start % 3600) // 60)
            s = int(seg.start % 60)
            txt_lines.append(f"[{h:02d}:{m:02d}:{s:02d}] {seg.speaker}:")
            prev_speaker = seg.speaker
        txt_lines.append(f"  {seg.text}")

        # SRT
        start_srt = format_time(seg.start)
        end_srt = format_time(seg.end)
        srt_lines.append(str(i + 1))
        srt_lines.append(f"{start_srt} --> {end_srt}")
        srt_lines.append(f"[{seg.speaker}]: {seg.text}\n")

        # JSON
        json_list.append({
            "speaker": seg.speaker,
            "start": seg.start,
            "end": seg.end,
            "text": seg.text
        })

    return {
        "txt": "\n".join(txt_lines),
        "srt": "\n".join(srt_lines),
        "json": json.dumps(json_list)
    }

def process_transcription(job_id: str, file_path: str, speaker_count: int):
    try:
        update_job_stage(job_id, Stage.TRANSCRIBING)
        
        model_path = WHISPER_MODEL_MAPPING.get(WHISPER_MODEL, WHISPER_MODEL)
        
        # Transcribe with MLX Whisper
        result = mlx_whisper.transcribe(file_path, path_or_hf_repo=model_path)
        segments = result.get("segments", [])
        if not segments:
            raise ValueError("No segments returned by Whisper")

        update_job_stage(job_id, Stage.IDENTIFYING_SPEAKERS)
        
        # Diarize
        diarizer = SpeechBrainDiarizer()
        labeled_segments = diarizer.transcribe(file_path, segments, speaker_count)
        
        # Render
        transcripts = render_transcripts(labeled_segments)
        total_lines = len(labeled_segments)
        
        update_job_stage(
            job_id, 
            Stage.DONE, 
            status=Status.COMPLETE, 
            total_lines=total_lines,
            transcripts=transcripts
        )
        
    except Exception as e:
        error_detail = traceback.format_exc()
        logger.error("Job %s failed: %s", job_id, error_detail)
        update_job_stage(job_id, Stage.DONE, status=Status.FAILED, error_detail=error_detail)
    finally:
        delete_upload(file_path)
