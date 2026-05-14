'use client'

import { useState, useCallback, useEffect } from 'react'
import { StarDropZone } from '@/components/star-drop-zone'
import { SpeakerCountDialog } from '@/components/speaker-count-dialog'
import { TranscriptionProgress } from '@/components/transcription-progress'
import { TranscriptionResult } from '@/components/transcription-result'
import { api } from '@/lib/api'
import type { TranscriptionDetail } from '@/lib/types'

type AppState = 
  | { type: 'idle' }
  | { type: 'awaiting-speaker-count'; file: File }
  | { type: 'uploading'; file: File; speakerCount: number }
  | { type: 'processing'; transcriptionId: string; filename: string; stage: string }
  | { type: 'complete'; transcription: TranscriptionDetail; filename: string }
  | { type: 'error'; message: string }

export default function Home() {
  const [state, setState] = useState<AppState>({ type: 'idle' })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileAccepted = useCallback((file: File) => {
    setErrorMessage(null)
    setState({ type: 'awaiting-speaker-count', file })
  }, [])

  const handleFileRejected = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  const handleSpeakerCountConfirm = useCallback(async (speakerCount: number) => {
    if (state.type !== 'awaiting-speaker-count') return

    const file = state.file
    setState({ type: 'uploading', file, speakerCount })

    try {
      const response = await api.uploadTranscription(file, speakerCount)
      setState({
        type: 'processing',
        transcriptionId: response.job_id,
        filename: file.name,
        stage: 'uploading',
      })
    } catch (error) {
      setState({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload file',
      })
    }
  }, [state])

  const handleSpeakerCountCancel = useCallback(() => {
    setState({ type: 'idle' })
  }, [])

  const handleNewTranscription = useCallback(() => {
    setState({ type: 'idle' })
    setErrorMessage(null)
  }, [])

  // Poll for progress updates
  useEffect(() => {
    if (state.type !== 'processing') return

    const pollInterval = setInterval(async () => {
      try {
        const transcription = await api.getTranscription(state.transcriptionId)
        
        if (transcription.status === 'complete') {
          clearInterval(pollInterval)
          setState({ type: 'complete', transcription, filename: state.filename })
        } else if (transcription.status === 'failed') {
          clearInterval(pollInterval)
          setState({
            type: 'error',
            message: 'Transcription failed',
          })
        } else {
          setState((prev) => {
            if (prev.type === 'processing') {
              return { ...prev, stage: transcription.stage }
            }
            return prev
          })
        }
      } catch (error) {
        console.error('Failed to poll transcription status:', error)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [state])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Idle state - show star */}
      {(state.type === 'idle' || state.type === 'error') && (
        <div className="flex flex-col items-center">
          <StarDropZone
            onFileAccepted={handleFileAccepted}
            onFileRejected={handleFileRejected}
          />
          {(errorMessage || state.type === 'error') && (
            <div className="mt-6 rounded-md bg-destructive/10 px-4 py-3 text-center">
              <p className="text-sm text-destructive">
                {state.type === 'error' ? state.message : errorMessage}
              </p>
              {state.type === 'error' && (
                <button
                  onClick={handleNewTranscription}
                  className="mt-2 text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Speaker count dialog */}
      <SpeakerCountDialog
        open={state.type === 'awaiting-speaker-count'}
        filename={state.type === 'awaiting-speaker-count' ? state.file.name : ''}
        onConfirm={handleSpeakerCountConfirm}
        onCancel={handleSpeakerCountCancel}
      />

      {/* Uploading state */}
      {state.type === 'uploading' && (
        <TranscriptionProgress
          filename={state.file.name}
          stage="uploading"
        />
      )}

      {/* Processing state */}
      {state.type === 'processing' && (
        <TranscriptionProgress
          filename={state.filename}
          stage={state.stage}
        />
      )}

      {/* Complete state */}
      {state.type === 'complete' && (
        <TranscriptionResult
          transcription={state.transcription}
          filename={state.filename}
          onNewTranscription={handleNewTranscription}
        />
      )}
    </main>
  )
}
