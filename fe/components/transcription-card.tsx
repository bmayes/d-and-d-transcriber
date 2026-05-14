'use client'

import Link from 'next/link'
import { FileAudio, Clock, FileText } from 'lucide-react'
import type { TranscriptionListResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TranscriptionCardProps {
  transcription: TranscriptionListResponse
  onSelect?: () => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TranscriptionCard({ transcription, onSelect }: TranscriptionCardProps) {
  const isComplete = transcription.status === 'complete'
  const isProcessing = transcription.status === 'processing'
  const isError = transcription.status === 'failed'

  return (
    <Link
      href={`/transcription/${transcription.job_id}`}
      onClick={onSelect}
      className={cn(
        'block rounded-lg border p-3 transition-colors hover:bg-accent',
        isError && 'border-destructive/30 bg-destructive/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 rounded-md p-2',
          isComplete && 'bg-yellow-400/10 text-yellow-600',
          isProcessing && 'bg-blue-400/10 text-blue-600',
          isError && 'bg-destructive/10 text-destructive'
        )}>
          <FileAudio className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">
            {transcription.filename}
          </p>
          
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {transcription.total_lines && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {transcription.total_lines} lines
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(transcription.created_at)}
            </span>
          </div>

          {isProcessing && (
            <div className="mt-2 text-xs text-blue-600">
              Processing...
            </div>
          )}

          {isError && (
            <p className="mt-1 text-xs text-destructive">
              Failed to process
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
