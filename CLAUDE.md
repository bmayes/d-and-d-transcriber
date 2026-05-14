# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`d-and-d-transcriber` is a Python/Streamlit drag-and-drop web app for transcribing audio files using OpenAI Whisper.

## Stack

- **Language:** Python 3.11 (3.14 is not supported by torch/whisper)
- **Transcription:** `openai-whisper`
- **UI:** `streamlit` (drag-and-drop file upload)
- **Audio processing:** `ffmpeg-python` + system `ffmpeg`
- **Linting:** Ruff
- **Testing:** pytest

## Setup

```bash
# Create venv (must use Python 3.11)
PYENV_VERSION=3.11.9 python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# System dependency — required by whisper for audio decoding
brew install ffmpeg
```

## Commands

```bash
# Run the app
streamlit run app.py

# Lint
ruff check .

# Format
ruff format .

# Run tests
pytest

# Run a single test
pytest path/to/test_file.py::test_function_name
```
# Run a single test
pytest path/to/test_file.py::test_function_name
```
