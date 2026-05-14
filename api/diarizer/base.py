from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class Segment:
    speaker: str   # "Speaker 1", "Speaker 2", …
    start: float   # seconds
    end: float
    text: str

class Diarizer(ABC):
    @abstractmethod
    def transcribe(self, audio_path: str, segments: List[Dict[str, Any]], num_speakers: int) -> List[Segment]:
        pass
