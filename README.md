# d-and-d-transcriber

A drag-and-drop web app for transcribing audio files using OpenAI Whisper.

## Requirements

- Python 3.11 (3.12+ is not supported by torch/whisper)
- [ffmpeg](https://ffmpeg.org/) (required by Whisper for audio decoding)

```bash
brew install ffmpeg
```

## Setup

```bash
# Create and activate virtual environment
PYENV_VERSION=3.11.9 python -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

## Running

```bash
streamlit run app.py
```