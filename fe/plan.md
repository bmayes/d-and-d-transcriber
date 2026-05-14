# Transcription App — Product Plan

## Core Concept

A minimal, single-purpose web app: a glowing yellow star in the center of the screen is the entire interface. Drop an audio file on it, tell us how many speakers, get back a diarized transcript.

## User Flow

```text
[Landing]
   |
   |  Big yellow star, "Drop an audio file" hint
   v
[Drag file over star]  --> star pulses / scales up to signal active drop zone
   |
   v
[Drop file]
   |
   |--> Unsupported format?  --> Inline toast: "Can't process .xyz — try mp3, wav, m4a, flac, ogg, webm"
   |                              (star resets, no upload)
   |
   v
[Speaker count modal]
   "How many speakers are in this audio?"
   [ - ] [ 2 ] [ + ]    ( 1–10 )
   [ Cancel ]  [ Transcribe ]
   |
   v
[Upload + Processing]
   Star morphs into a progress indicator (filling / orbiting)
   Status text: "Uploading…" -> "Transcribing…" -> "Identifying speakers…"
   |
   v
[Result view]
   Diarized transcript: Speaker 1 / Speaker 2 blocks with timestamps
   Actions: Copy, Download (.txt / .json / .srt), New file (returns to star)
```

## Scope — V1

**In:**
1. Yellow star drop zone (also clickable to open file picker as fallback)
2. Client-side file validation (extension + MIME + size cap, e.g. 100 MB)
3. Speaker count prompt (modal after drop, default 2, range 1–10)
4. Upload to FastAPI `POST /api/transcriptions` (multipart: file + speaker_count)
5. Progress states: spinning ring with stage label — `Uploading… → Transcribing… → Identifying speakers… → Done` (mlx-whisper does not emit per-segment callbacks; granular 0–100% is not available in V1)
6. Transcript view with speaker labels + timestamps
7. Download (txt, json, srt) and copy-to-clipboard. SRT embeds speaker labels as `[Speaker N]: text` within subtitle content blocks.
8. Clear error states (unsupported format, file too large, backend failure, timeout). Backend crash surfaces as a `failed` job status with a user-facing error message; no retry in V1.
9. "Start over" to return to the star

**In (FE implementation pending — backend must ship first):**
10. Transcription history sidebar: list of past jobs, click to reload transcript, delete button per entry.

**Out (later):**
- Auth / user accounts
- pyannote swap (architected to be a one-file change on the backend)
- Speaker renaming / editing transcript
- Live recording from mic
- Multi-file batch
- Sharing links

## Backend Contract

See [`prd.md` — API Contract section](../prd.md) for the authoritative endpoint definitions. Frontend configures base URL via `NEXT_PUBLIC_TRANSCRIBE_API_URL` (default: `http://localhost:16767`).

## Diarization Abstraction (for future pyannote swap)

Backend exposes one interface:

```text
class Diarizer:
    def transcribe(audio_path, num_speakers) -> list[Segment]
```

V1 implementation wraps current basic transcribe. Swapping to pyannote = new class behind the same interface, no API or frontend changes.

## Design Direction

- Pure black background, single oversized yellow star (CSS/SVG, soft glow)
- Star idle: gentle pulse. Hover/drag-over: scales 1.1, glow intensifies. Drop: quick burst.
- Typography: one bold display font for the prompt, mono for transcript timestamps
- No nav, no footer, no marketing copy — the star is the product

## Technical Details

- Frontend: Next.js App Router, drop zone with native HTML5 drag/drop API + `<input type="file" accept="audio/*">` fallback
- Supported formats (frontend allowlist): `.mp3 .wav .m4a .flac .ogg .webm .mp4`
- Validation order: extension → size → MIME sniff → upload
- Star: inline SVG so we can animate fill, glow, and morph into a progress ring
- State: local component state (no global store needed for V1) — `idle | dragging | prompting | uploading | processing | done | error`
- Backend lives separately (your existing FastAPI). Frontend calls it via `NEXT_PUBLIC_TRANSCRIBE_API_URL` env var (default: `http://localhost:16767`); CORS configured on FastAPI side.
- Error surfaces: small toast under the star, never blocks the interface

## Resolved Decisions

1. **Speaker count timing** — ask after drop, before upload. ✓
2. **Sync vs async** — async. POST returns 202 + job_id; frontend polls GET until complete. ✓
3. **Max file size** — 100 MB cap (`MAX_UPLOAD_BYTES` constant). Duration cap not enforced in V1. ✓
4. **Transcript formats** — txt, json, srt all in V1. SRT embeds `[Speaker N]:` as text content. ✓

## Open Questions

- Should we cap max duration separately from file size? (A low-bitrate 3-hour file could be under 100 MB.)
- Speaker renaming / inline transcript editing — future or V1?
