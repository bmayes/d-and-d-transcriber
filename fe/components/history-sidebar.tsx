'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { TranscriptionCard } from '@/components/transcription-card'
import { api } from '@/lib/api'
import type { Transcription } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'

interface HistorySidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistorySidebar({ open, onOpenChange }: HistorySidebarProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function fetchTranscriptions() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.listTranscriptions()
        setTranscriptions(response.transcriptions)
      } catch (err) {
        setError('Failed to load transcriptions')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTranscriptions()
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Transcription History</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!isLoading && !error && transcriptions.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No transcriptions yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Drop an audio file on the star to get started
              </p>
            </div>
          )}

          {!isLoading && !error && transcriptions.map((transcription) => (
            <TranscriptionCard
              key={transcription.id}
              transcription={transcription}
              onSelect={() => onOpenChange(false)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
