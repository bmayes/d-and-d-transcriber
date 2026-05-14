'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import type { Transcription } from '@/lib/types'

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TranscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchTranscription() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await api.getTranscription(id)
        setTranscription(data)
      } catch (err) {
        setError('Failed to load transcription')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTranscription()
  }, [id])

  // Poll for updates if processing
  useEffect(() => {
    if (!transcription || transcription.status !== 'processing') return

    const pollInterval = setInterval(async () => {
      try {
        const data = await api.getTranscription(id)
        setTranscription(data)
        if (data.status !== 'processing') {
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error('Failed to poll status:', err)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [transcription, id])

  const handleDownload = () => {
    if (!transcription) return
    const url = api.getDownloadUrl(transcription.id)
    window.open(url, '_blank')
  }

  const handleDelete = async () => {
    if (!transcription || isDeleting) return
    
    if (!confirm('Are you sure you want to delete this transcription?')) return

    setIsDeleting(true)
    try {
      await api.deleteTranscription(transcription.id)
      router.push('/')
    } catch (err) {
      setError('Failed to delete transcription')
      console.error(err)
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Spinner className="h-8 w-8" />
      </main>
    )
  }

  if (error || !transcription) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive">{error || 'Transcription not found'}</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </main>
    )
  }

  const isProcessing = transcription.status === 'processing'
  const isError = transcription.status === 'error'

  return (
    <main className="min-h-screen p-4 pt-20">
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="truncate">{transcription.filename}</span>
            </CardTitle>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                {transcription.speaker_count} speaker{transcription.speaker_count > 1 ? 's' : ''}
              </span>
              {transcription.duration_seconds && (
                <span>{formatDuration(transcription.duration_seconds)}</span>
              )}
              {transcription.total_lines && (
                <span>{transcription.total_lines} lines</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Created: {formatDate(transcription.created_at)}
              {transcription.completed_at && (
                <> &middot; Completed: {formatDate(transcription.completed_at)}</>
              )}
            </p>
          </CardHeader>

          <CardContent>
            {isProcessing && (
              <div className="py-8 text-center">
                <Spinner className="mx-auto h-8 w-8" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Processing... {transcription.progress}%
                </p>
                <div className="mx-auto mt-2 h-2 w-48 rounded-full bg-primary/20">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${transcription.progress}%` }}
                  />
                </div>
              </div>
            )}

            {isError && (
              <div className="rounded-md bg-destructive/10 px-4 py-8 text-center">
                <p className="text-destructive">
                  {transcription.error_message || 'Failed to process transcription'}
                </p>
              </div>
            )}

            {transcription.status === 'complete' && (
              <div className="rounded-md border bg-muted/30 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Preview (first 50 lines)
                </p>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
                  {transcription.transcript_preview || 'No preview available'}
                </pre>
              </div>
            )}
          </CardContent>

          {transcription.status === 'complete' && (
            <CardFooter className="flex gap-3">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Full Transcript
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive hover:text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  )
}
