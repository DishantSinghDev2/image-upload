"use client"

import type React from "react"
import { useCallback, useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Check, Copy, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { getRateLimitConfig } from "@/lib/rate-limit"
import { addToHistory } from "@/lib/upload-history"
import { ExpirationSelector } from "./expiration-selector" // Import the new component

// ... (Types remain the same as previous) ...
interface UploadItem {
  id: string
  url?: string
  error?: string
  done: boolean
}
interface BatchStatus {
  success: boolean
  batchId: string
  total: number
  completed: number
  failed: number
  percent: number
  items: UploadItem[]
}
interface LocalFile {
  id: string
  file: File
  preview: string
  size: number
}

export function UploadDropzone() {
  const { data: session } = useSession()
  const isUserPro = (session?.user as any)?.isUserPro || false
  const isLoggedIn = !!session
  const config = getRateLimitConfig(isUserPro, isLoggedIn)

  // State
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<LocalFile[]>([])

  // Stores expiration in DAYS. Null means "Never"
  const [selectedExpiration, setSelectedExpiration] = useState<number | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [globalError, setGlobalError] = useState<string>("")

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ... (Drag and Drop Handlers handleDragOver, handleDrop, addFiles remain the same) ...

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const addFiles = useCallback(
    (files: FileList) => {
      setGlobalError("")
      if (batchStatus) {
        setBatchStatus(null)
        setSelectedFiles([])
      }
      const fileArray = Array.from(files)
      if (fileArray.length + selectedFiles.length > config.maxBulkUpload) {
        setGlobalError(`You can only upload up to ${config.maxBulkUpload} files at once.`)
        return
      }
      const newFiles: LocalFile[] = []
      for (const file of fileArray) {
        if (file.size > config.maxFileSize) {
          setGlobalError(`File "${file.name}" exceeds the ${config.maxFileSize / 1024 / 1024}MB limit.`)
          continue
        }
        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          size: file.size,
        })
      }
      setSelectedFiles((prev) => [...prev, ...newFiles])
    },
    [selectedFiles, config.maxBulkUpload, config.maxFileSize, batchStatus],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find(f => f.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // --- Upload Logic ---

  const startUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setGlobalError("")

    // 1. Prepare Form Data
    const formData = new FormData()
    selectedFiles.forEach((f) => {
      formData.append("files[]", f.file)
    })
    if (isUserPro && selectedExpiration) {
      formData.append("expiration", selectedExpiration.toString())
    }

    try {
      // 2. GET SECURE TOKEN from Next.js (Tiny request, fast)
      const tokenRes = await fetch("/api/upload/token")
      if (!tokenRes.ok) throw new Error("Failed to get upload permission")
      const { timestamp, signature, endpoint } = await tokenRes.json()

      // 3. UPLOAD DIRECTLY TO CLOUDFLARE (Bypassing Next.js/Vercel limits)
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          "x-auth-ts": String(timestamp),
          "x-auth-sig": signature,
          // Do NOT set Content-Type manually for FormData, browser does it with boundary
        },
      })

      const data = await res.json()

      if (!data.success || !data.batchId) {
        throw new Error(data.error || "Failed to initiate upload")
      }

      // 4. Initialize Polling (Same as before)
      setBatchStatus({
        success: true,
        batchId: data.batchId,
        total: selectedFiles.length,
        completed: 0,
        failed: 0,
        percent: 0,
        items: []
      })


      const batchId = data.batchId
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/upload/bulk/${batchId}`)
          const pollData: BatchStatus = await pollRes.json()

          setBatchStatus(pollData)

          if (pollData.percent >= 100) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setIsUploading(false)

            // Add to History
            pollData.items.forEach(item => {
              if (item.done && item.url && !item.error) {
                const original = selectedFiles.find((_, idx) => idx.toString() === item.id)
                const size = original ? original.size : 0

                addToHistory({
                  id: item.id,
                  title: `Upload ${new Date().toLocaleTimeString()}`,
                  url: item.url,
                  size: size,
                  timestamp: Date.now(),
                  // Save calculated expiration timestamp for history reference
                  expiration: selectedExpiration
                    ? Date.now() + (selectedExpiration * 24 * 60 * 60 * 1000)
                    : undefined,
                  deleteUrl: ""
                })
              }
            })
          }
        } catch (err) {
          console.error("Polling error", err)
        }
      }, 1000)

    } catch (err: any) {
      console.error(err)
      setGlobalError(err.message || "Upload failed")
      setIsUploading(false)
    }
  }

  // --- Render ---

  return (
    <div className="w-full space-y-8">

      {!batchStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-surface"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
              accept="image/*"
            />
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full transition-colors ${isDragging ? "bg-primary/10" : "bg-surface border border-border"}`}>
                <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-secondary"}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">
                  {isDragging ? "Drop files now" : "Drop images here"}
                </h3>
                <p className="text-secondary text-sm">
                  or click to browse • Max {config.maxFileSize / 1024 / 1024}MB • Up to {config.maxBulkUpload} files
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* File Grid */}
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-semibold text-sm text-secondary">Selected ({selectedFiles.length})</h4>
                  <button onClick={() => setSelectedFiles([])} className="text-xs text-red-400 hover:text-red-300">
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {selectedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-surface border border-border"
                    >
                      <img src={file.preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Settings Panel */}
                <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
                  {/* The New Expiration Selector */}
                  <ExpirationSelector
                    isProUser={isUserPro}
                    selectedDays={selectedExpiration}
                    onSelect={setSelectedExpiration}
                  />

                  <button
                    onClick={startUpload}
                    disabled={isUploading}
                    className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg hover:brightness-110 transition-all active:scale-[0.99]"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {globalError && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-lg text-sm border border-red-500/20">
              <AlertCircle className="w-4 h-4" />
              {globalError}
            </div>
          )}
        </motion.div>
      )}

      {/* Progress & Results View (Existing Code) */}
      {batchStatus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg font-semibold">
                  {batchStatus.percent < 100 ? "Uploading..." : "Upload Complete"}
                </h3>
                <p className="text-sm text-secondary">
                  {batchStatus.completed}/{batchStatus.total} successful • {batchStatus.failed} failed
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{Math.round(batchStatus.percent)}%</span>
            </div>
            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${batchStatus.percent}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batchStatus.items.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  flex items-center gap-4 p-3 rounded-lg border 
                  ${item.done && !item.error ? "border-green-500/20 bg-green-500/5" : ""}
                  ${item.error ? "border-red-500/20 bg-red-500/5" : ""}
                  ${!item.done ? "border-border bg-surface" : ""}
                `}
              >
                <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-background">
                  {item.url ? (
                    <img src={item.url} alt="Uploaded" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary">
                      {item.error ? <AlertCircle className="w-6 h-6 text-red-500" /> : <Loader2 className="w-6 h-6 animate-spin" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.error ? (
                    <p className="text-sm text-red-500 font-medium truncate">{item.error}</p>
                  ) : item.url ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-500 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={item.url}
                          className="text-xs bg-background border border-border rounded px-2 py-1 w-full text-secondary"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-secondary animate-pulse">Processing...</p>
                  )}
                </div>
                {item.url && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyToClipboard(item.url!)}
                      className="p-2 hover:bg-background rounded-md text-secondary hover:text-primary transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-background rounded-md text-secondary hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {batchStatus.percent === 100 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-8">
              <button
                onClick={() => {
                  setBatchStatus(null)
                  setSelectedFiles([])
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-secondary/10 hover:bg-secondary/20 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload More Images
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}