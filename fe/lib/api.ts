import type { Transcription, TranscriptionListResponse, UploadResponse, ApiError } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async uploadTranscription(file: File, speakerCount: number): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('speaker_count', speakerCount.toString())

    const response = await fetch(`${this.baseUrl}/api/transcriptions`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || 'Failed to upload file')
    }

    return response.json()
  }

  async getTranscription(id: string): Promise<Transcription> {
    const response = await fetch(`${this.baseUrl}/api/transcriptions/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch transcription')
    }

    return response.json()
  }

  async listTranscriptions(): Promise<TranscriptionListResponse> {
    const response = await fetch(`${this.baseUrl}/api/transcriptions`)

    if (!response.ok) {
      throw new Error('Failed to fetch transcriptions')
    }

    return response.json()
  }

  async deleteTranscription(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/transcriptions/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete transcription')
    }
  }

  getDownloadUrl(id: string): string {
    return `${this.baseUrl}/api/transcriptions/${id}/download`
  }
}

export const api = new ApiClient(API_URL)
