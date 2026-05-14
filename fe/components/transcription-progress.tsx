'use client'

import { Progress } from '@/components/ui/progress'

interface TranscriptionProgressProps {
  filename: string
  progress: number
  status: 'uploading' | 'processing'
}

export function TranscriptionProgress({
  filename,
  progress,
  status,
}: TranscriptionProgressProps) {
  const statusText = status === 'uploading' ? 'Uploading...' : 'Transcribing...'

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium truncate max-w-[200px]">{filename}</p>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {statusText}
      </p>
    </div>
  )
}
