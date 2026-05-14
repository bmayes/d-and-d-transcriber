export type TranscriptionStatus = 'processing' | 'complete' | 'failed'
export type TranscriptionStage = 'uploading' | 'transcribing' | 'identifying_speakers' | 'done'

export interface TranscriptionDetail {
  job_id: string
  filename: string
  created_at: string
  status: TranscriptionStatus
  stage: TranscriptionStage
  transcript_preview?: string
  total_lines?: number
}

export interface TranscriptionListResponse {
  job_id: string
  created_at: string
  filename: string
  status: TranscriptionStatus
  total_lines?: number
}

export interface UploadResponse {
  job_id: string
  status: TranscriptionStatus
}

export interface ApiError {
  detail: string
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
