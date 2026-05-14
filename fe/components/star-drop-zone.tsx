'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { isValidAudioFile, SUPPORTED_EXTENSIONS } from '@/lib/types'

interface StarDropZoneProps {
  onFileAccepted: (file: File) => void
  onFileRejected: (message: string) => void
  disabled?: boolean
}

export function StarDropZone({ onFileAccepted, onFileRejected, disabled }: StarDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (isValidAudioFile(file)) {
        onFileAccepted(file)
      } else {
        onFileRejected(
          `Unsupported file format. Please use: ${SUPPORTED_EXTENSIONS.join(', ')}`
        )
      }
    },
    [onFileAccepted, onFileRejected]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [disabled, handleFile]
  )

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
      // Reset input so the same file can be selected again
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-transform duration-300',
        isDragOver && !disabled && 'scale-110',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Star SVG */}
      <svg
        viewBox="0 0 24 24"
        className={cn(
          'h-48 w-48 md:h-64 md:w-64 transition-all duration-300',
          !disabled && 'animate-pulse-slow',
          isDragOver && !disabled && 'drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]'
        )}
        fill="currentColor"
      >
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          className={cn(
            'transition-colors duration-300',
            isDragOver && !disabled ? 'text-yellow-300' : 'text-yellow-400'
          )}
        />
      </svg>

      {/* Instruction text */}
      <p className="mt-6 text-center text-muted-foreground">
        {isDragOver ? 'Drop your audio file here' : 'Drag audio file here or click to browse'}
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground/70">
        Supported: MP3, WAV, M4A, FLAC, OGG
      </p>
    </div>
  )
}
