'use client'

import { Progress } from '@/components/ui/progress'

interface TranscriptionProgressProps {
  filename: string
  stage: string
}

export function TranscriptionProgress({
  filename,
  stage,
}: TranscriptionProgressProps) {
  let statusText = 'Processing...'
  let progress = 0

  if (stage === 'uploading') {
    statusText = 'Uploading...'
    progress = 10
  } else if (stage === 'transcribing') {
    statusText = 'Transcribing audio...'
    progress = 50
  } else if (stage === 'identifying_speakers') {
    statusText = 'Identifying speakers...'
    progress = 80
  } else if (stage === 'done') {
    statusText = 'Done!'
    progress = 100
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium truncate max-w-[200px]">{filename}</p>
        <span className="text-sm text-muted-foreground">{statusText}</span>
      </div>
      
      <Progress value={progress} className="h-2" />
    </div>
  )
}
