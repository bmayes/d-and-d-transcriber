'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, RotateCcw } from 'lucide-react'
import type { Transcription } from '@/lib/types'
import { api } from '@/lib/api'

interface TranscriptionResultProps {
  transcription: Transcription
  onNewTranscription: () => void
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TranscriptionResult({
  transcription,
  onNewTranscription,
}: TranscriptionResultProps) {
  const handleDownload = () => {
    const url = api.getDownloadUrl(transcription.id)
    window.open(url, '_blank')
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{transcription.filename}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{transcription.speaker_count} speaker{transcription.speaker_count > 1 ? 's' : ''}</span>
          {transcription.duration_seconds && (
            <span>{formatDuration(transcription.duration_seconds)}</span>
          )}
          {transcription.total_lines && (
            <span>{transcription.total_lines} lines</span>
          )}
          {transcription.completed_at && (
            <span>{formatDate(transcription.completed_at)}</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Preview (first 50 lines)
          </p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
            {transcription.transcript_preview || 'No preview available'}
          </pre>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download Full Transcript
        </Button>
        <Button variant="outline" onClick={onNewTranscription}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New
        </Button>
      </CardFooter>
    </Card>
  )
}
