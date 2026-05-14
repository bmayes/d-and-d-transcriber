'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, RotateCcw } from 'lucide-react'
import type { TranscriptionDetail } from '@/lib/types'
import { api } from '@/lib/api'

interface TranscriptionResultProps {
  transcription: TranscriptionDetail
  filename: string
  onNewTranscription: () => void
}

export function TranscriptionResult({
  transcription,
  filename,
  onNewTranscription,
}: TranscriptionResultProps) {
  const handleDownload = (format: string) => {
    const url = api.getDownloadUrl(transcription.job_id, format)
    window.open(url, '_blank')
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{filename}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {transcription.total_lines && (
            <span>{transcription.total_lines} lines</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Preview (first 10 lines)
          </p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
            {transcription.transcript_preview || 'No preview available'}
          </pre>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => handleDownload('txt')} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          TXT
        </Button>
        <Button onClick={() => handleDownload('json')} className="flex-1" variant="secondary">
          <Download className="mr-2 h-4 w-4" />
          JSON
        </Button>
        <Button onClick={() => handleDownload('srt')} className="flex-1" variant="secondary">
          <Download className="mr-2 h-4 w-4" />
          SRT
        </Button>
        <Button variant="outline" onClick={onNewTranscription}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New
        </Button>
      </CardFooter>
    </Card>
  )
}
