import os
from .base import Diarizer, Segment
from typing import List, Dict, Any

TARGET_SR = 16000
PRETRAINED_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "pretrained_models", "spkrec-ecapa-voxceleb"
)

def load_audio(path):
    import numpy as np
    import subprocess
    import torch

    cmd = [
        "ffmpeg", "-i", path,
        "-f", "f32le", "-acodec", "pcm_f32le",
        "-ac", "1", "-ar", str(TARGET_SR),
        "-", "-loglevel", "quiet",
    ]
    raw = subprocess.run(cmd, stdout=subprocess.PIPE, check=True).stdout
    waveform = torch.from_numpy(np.frombuffer(raw, dtype=np.float32).copy()).unsqueeze(0)
    return waveform

def get_embeddings(classifier, waveform, segments):
    import torch

    min_samples = TARGET_SR
    embeddings = []
    for seg in segments:
        start_frame = int(seg["start"] * TARGET_SR)
        end_frame = int(seg["end"] * TARGET_SR)
        chunk = waveform[:, start_frame:end_frame]
        if chunk.shape[1] < min_samples:
            embeddings.append(None)
            continue
        with torch.no_grad():
            emb = classifier.encode_batch(chunk)
        embeddings.append(emb.squeeze().cpu().numpy())
    return embeddings

def cluster_speakers(embeddings, num_speakers=None):
    import numpy as np
    from sklearn.cluster import AgglomerativeClustering

    indexed = [(i, e) for i, e in enumerate(embeddings) if e is not None]
    if not indexed:
        return [0] * len(embeddings)

    indices, valid = zip(*indexed)
    matrix = np.stack(valid)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix = matrix / np.where(norms == 0, 1, norms)

    if num_speakers is not None:
        clustering = AgglomerativeClustering(
            n_clusters=num_speakers, metric="cosine", linkage="average"
        )
    else:
        clustering = AgglomerativeClustering(
            n_clusters=None, distance_threshold=0.4, metric="cosine", linkage="average"
        )

    labels = clustering.fit_predict(matrix)

    full_labels = [0] * len(embeddings)
    for idx, label in zip(indices, labels):
        full_labels[idx] = label

    # Short segments inherit the label of the preceding segment
    for i in range(1, len(embeddings)):
        if embeddings[i] is None:
            full_labels[i] = full_labels[i - 1]

    return full_labels

class SpeechBrainDiarizer(Diarizer):
    def transcribe(self, audio_path: str, segments: List[Dict[str, Any]], num_speakers: int) -> List[Segment]:
        try:
            from speechbrain.inference.classifiers import EncoderClassifier
        except ImportError:
            from speechbrain.pretrained import EncoderClassifier

        waveform = load_audio(audio_path)
        classifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir=PRETRAINED_DIR,
        )

        embeddings = get_embeddings(classifier, waveform, segments)
        labels = cluster_speakers(embeddings, num_speakers)

        labeled_segments = []
        for seg, label in zip(segments, labels):
            text = seg["text"].strip()
            if not text:
                continue
            speaker = f"Speaker {label + 1}"
            labeled_segments.append(Segment(
                speaker=speaker,
                start=seg["start"],
                end=seg["end"],
                text=text
            ))
        return labeled_segments
