'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SpeakerCountDialogProps {
  open: boolean
  filename: string
  onConfirm: (speakerCount: number) => void
  onCancel: () => void
}

export function SpeakerCountDialog({
  open,
  filename,
  onConfirm,
  onCancel,
}: SpeakerCountDialogProps) {
  const [speakerCount, setSpeakerCount] = useState(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (speakerCount >= 1 && speakerCount <= 10) {
      onConfirm(speakerCount)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>How many speakers?</DialogTitle>
            <DialogDescription>
              Enter the number of speakers in &quot;{filename}&quot; for better transcription accuracy.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <label htmlFor="speaker-count" className="text-sm font-medium">
              Number of speakers
            </label>
            <Input
              id="speaker-count"
              type="number"
              min={1}
              max={10}
              value={speakerCount}
              onChange={(e) => setSpeakerCount(parseInt(e.target.value) || 1)}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter a value between 1 and 10
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Start Transcription</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
