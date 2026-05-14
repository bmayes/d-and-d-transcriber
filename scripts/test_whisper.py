import argparse
import os
import sys

import mlx_whisper

MODEL_MAPPING = {
    "tiny": "mlx-community/whisper-tiny-mlx",
    "base": "mlx-community/whisper-base-mlx",
    "small": "mlx-community/whisper-small-mlx",
    "medium": "mlx-community/whisper-medium-mlx",
    "large": "mlx-community/whisper-large-v3-mlx",
    "turbo": "mlx-community/whisper-large-v3-turbo",
}

TARGET_SR = 16000
PRETRAINED_DIR = os.path.join(
    os.path.dirname(__file__), "..", "pretrained_models", "spkrec-ecapa-voxceleb"
)


def transcribe(filename, model_path):
    print(f"Loading {model_path}...")
    print(f"Transcribing {filename}...")
    return mlx_whisper.transcribe(filename, path_or_hf_repo=model_path)


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

    # ECAPA conv layers require at least ~0.5s; use 1s minimum for reliable embeddings
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
        # distance_threshold of 0.4 ≈ cosine similarity 0.8; tune if over/under-splitting
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


def diarize(filename, segments, num_speakers=None):
    try:
        from speechbrain.inference.classifiers import EncoderClassifier
    except ImportError:
        from speechbrain.pretrained import EncoderClassifier

    print("Loading audio for diarization...")
    waveform = load_audio(filename)

    print("Loading SpeechBrain speaker encoder (downloads on first run)...")
    classifier = EncoderClassifier.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb",
        savedir=PRETRAINED_DIR,
    )

    print("Extracting speaker embeddings...")
    embeddings = get_embeddings(classifier, waveform, segments)

    print("Clustering speakers...")
    labels = cluster_speakers(embeddings, num_speakers)

    num_found = len(set(labels))
    print(f"Detected {num_found} speaker(s).")
    return labels


def fmt_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def build_diarized_transcript(segments, speaker_labels):
    lines = []
    prev_speaker = None
    for seg, label in zip(segments, speaker_labels):
        text = seg["text"].strip()
        if not text:
            continue
        speaker = f"Speaker {label + 1}"
        if speaker != prev_speaker:
            lines.append(f"[{fmt_time(seg['start'])}] {speaker}:")
            prev_speaker = speaker
        lines.append(f"  {text}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe an audio file using MLX Whisper (optimized for Apple Silicon)."
    )
    parser.add_argument("filename", help="Path to the audio file (e.g., recording.m4a)")
    parser.add_argument("--model", default="turbo", help="Whisper model to use (default: turbo)")
    parser.add_argument("--diarize", action="store_true", help="Detect and label speakers")
    parser.add_argument(
        "--speakers",
        type=int,
        default=None,
        help="Number of speakers for diarization (auto-detected if omitted)",
    )

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    args = parser.parse_args()

    if not os.path.exists(args.filename):
        print(f"Error: File '{args.filename}' not found.")
        sys.exit(1)

    model_path = MODEL_MAPPING.get(args.model, args.model)
    if "/" not in model_path and not os.path.exists(model_path):
        model_path = f"mlx-community/whisper-{args.model}-mlx"

    try:
        result = transcribe(args.filename, model_path)
    except Exception as e:
        print(f"Error during transcription: {e}")
        sys.exit(1)

    if args.diarize:
        segments = result.get("segments", [])
        if not segments:
            print("No segments returned by Whisper; cannot diarize.")
            sys.exit(1)

        try:
            speaker_labels = diarize(args.filename, segments, args.speakers)
        except Exception as e:
            print(f"Error during diarization: {e}")
            sys.exit(1)

        transcript = build_diarized_transcript(segments, speaker_labels)
        output_filename = os.path.splitext(args.filename)[0] + "_diarized.txt"
    else:
        transcript = result["text"]
        output_filename = os.path.splitext(args.filename)[0] + ".txt"

    print("\n--- Transcript ---\n")
    print(transcript)

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(transcript)

    print(f"\nSaved transcript to: {output_filename}")


if __name__ == "__main__":
    main()
