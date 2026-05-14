export type TranscriptionStatus = 'processing' | 'complete' | 'error'

export interface Transcription {
  id: string
  status: TranscriptionStatus
  progress: number
  filename: string
  speaker_count: number
  created_at: string
  completed_at?: string
  transcript_preview?: string
  total_lines?: number
  duration_seconds?: number
  error_message?: string
}

export interface TranscriptionListResponse {
  transcriptions: Transcription[]
}

export interface UploadResponse {
  id: string
  status: TranscriptionStatus
  filename: string
  speaker_count: number
  created_at: string
}

export interface ApiError {
  error: string
  message: string
}

export const SUPPORTED_FORMATS = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/mp4': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  'audio/flac': ['.flac'],
  'audio/ogg': ['.ogg'],
} as const

export const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg']

export function isValidAudioFile(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const mimeType = file.type

  // Check by extension
  if (SUPPORTED_EXTENSIONS.includes(extension)) {
    return true
  }

  // Check by MIME type
  if (mimeType in SUPPORTED_FORMATS) {
    return true
  }

  return false
}

export function getFileExtension(filename: string): string {
  return '.' + filename.split('.').pop()?.toLowerCase()
}
