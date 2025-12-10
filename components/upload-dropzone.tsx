"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Upload, AlertCircle } from "lucide-react"
import { getRateLimitConfig } from "@/lib/rate-limit"
import { addToHistory } from "@/lib/upload-history"
import { uploadImageToServer } from "@/lib/upload-api"
import { ExpirationSelector } from "./expiration-selector"
import { ImagePreviewGallery } from "./image-preview-gallery"

interface UploadDropzoneProps {
  onUploadComplete?: (urls: string[]) => void
}

interface ImageFile {
  id: string
  file: File
  preview: string
  size: number
}

export function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [error, setError] = useState<string>("")
  const [selectedExpiration, setSelectedExpiration] = useState<number | null>(null)

  const isUserPro = (session?.user as any)?.isUserPro || false
  const isLoggedIn = !!session
  const config = getRateLimitConfig(isUserPro, isLoggedIn)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const addFilesToPreview = useCallback(
    (files: FileList) => {
      setError("")
      const fileArray = Array.from(files)

      if (fileArray.length + selectedFiles.length > config.maxBulkUpload) {
        setError(`Maximum ${config.maxBulkUpload} files at once`)
        return
      }

      const newFiles: ImageFile[] = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        size: file.size,
      }))

      setSelectedFiles((prev) => [...prev, ...newFiles])
    },
    [selectedFiles, config.maxBulkUpload],
  )

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updated
    })
  }, [])

  const uploadAllFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    const urls: string[] = []

    for (const imageFile of selectedFiles) {
      if (imageFile.size > config.maxFileSize) {
        setError(`File "${imageFile.file.name}" exceeds limit of ${config.maxFileSize / 1024 / 1024}MB`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append("file", imageFile.file)
        if (isUserPro && selectedExpiration) {
          formData.append("expiration", selectedExpiration.toString())
        }

        const response = await uploadImageToServer(formData)

        if (response.success && response.data) {
          const imageUrl = response.data.url || response.data.display_url
          urls.push(imageUrl)

          addToHistory({
            id: response.data.id,
            title: response.data.title,
            url: imageUrl,
            size: Number.parseInt(response.data.size),
            timestamp: Date.now(),
            expiration: selectedExpiration || undefined,
            deleteUrl: response.data.delete_url,
          })
        }
      } catch (err) {
        console.error("[v0] Upload failed:", err)
      }
    }

    // Clean up previews
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview))
    setSelectedFiles([])
    setUploadedUrls((prev) => [...prev, ...urls])
    setIsUploading(false)

    if (urls.length > 0) {
      onUploadComplete?.(urls)
    }
  }, [selectedFiles, config.maxFileSize, isUserPro, selectedExpiration, onUploadComplete])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      addFilesToPreview(e.dataTransfer.files)
    },
    [addFilesToPreview],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFilesToPreview(e.target.files)
      }
    },
    [addFilesToPreview],
  )

  return (
    <div className="w-full space-y-6">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          backgroundColor: isDragging ? "rgba(101, 218, 255, 0.1)" : "transparent",
          borderColor: isDragging ? "rgb(101, 218, 255)" : "rgb(51, 65, 85)",
        }}
        className="relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors"
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
        />

        <motion.div animate={{ scale: isDragging ? 1.1 : 1 }} className="flex flex-col items-center gap-3">
          <motion.div animate={{ y: isDragging ? -5 : 0 }}>
            <Upload className="w-12 h-12 text-primary mx-auto" />
          </motion.div>

          <div>
            <h3 className="text-xl font-semibold">Drop images here</h3>
            <p className="text-secondary">
              or click to browse (max {config.maxFileSize / 1024 / 1024}MB per file, up to {config.maxBulkUpload} files)
            </p>
          </div>
        </motion.div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-secondary">Uploading...</p>
            </div>
          </div>
        )}
      </motion.div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Selected Files ({selectedFiles.length}/{config.maxBulkUpload})
            </h3>
            <button
              onClick={() => {
                selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview))
                setSelectedFiles([])
              }}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              Clear All
            </button>
          </div>
          <ImagePreviewGallery files={selectedFiles} onRemove={removeFile} />
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-6">
        <ExpirationSelector isProUser={isUserPro} onSelect={setSelectedExpiration} selectedDays={selectedExpiration} />
      </div>

      {selectedFiles.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={uploadAllFiles}
          disabled={isUploading}
          className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Image${selectedFiles.length > 1 ? "s" : ""}`}
        </motion.button>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {uploadedUrls.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="font-semibold text-lg">Recently Uploaded</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedUrls.map((url) => (
              <motion.div
                key={url}
                layoutId={url}
                className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-border group"
              >
                <img src={url || "/placeholder.svg"} alt="Uploaded" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(url)}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:brightness-110 transition-all"
                  >
                    Copy
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:brightness-110 transition-all"
                  >
                    View
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
