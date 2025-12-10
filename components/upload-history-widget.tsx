"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Trash2, Copy, Share2 } from "lucide-react"
import type { UploadedImage } from "@/lib/upload-history"
import { getUploadHistory, removeFromHistory } from "@/lib/upload-history"
import { generateShareLink } from "@/lib/upload-api"

export function UploadHistoryWidget() {
  const [history, setHistory] = useState<UploadedImage[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setHistory(getUploadHistory())
  }, [])

  const displayed = showAll ? history : history.slice(0, 6)

  const handleRemove = (id: string) => {
    removeFromHistory(id)
    setHistory(getUploadHistory())
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const handleShare = (url: string, platform: "twitter" | "facebook" | "linkedin" | "email") => {
    const link = generateShareLink(url, platform)
    window.open(link, "_blank")
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-secondary">
        <p>No upload history yet. Start uploading images!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Uploads</h3>
        <span className="text-sm text-secondary">{history.length} total</span>
      </div>

      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayed.map((image) => (
          <motion.div
            key={image.id}
            layoutId={`history-${image.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="group relative aspect-square rounded-lg overflow-hidden bg-surface border border-border cursor-pointer"
          >
            <img src={image.url || "/placeholder.svg"} alt={image.title} className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopy(image.url)}
                  className="p-2 bg-primary rounded-lg hover:brightness-110 transition-all"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4 text-primary-foreground" />
                </button>
                <button
                  onClick={() => handleRemove(image.id)}
                  className="p-2 bg-destructive rounded-lg hover:brightness-110 transition-all"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>

              <button
                onClick={() => handleShare(image.url, "twitter")}
                className="w-full py-1 bg-accent/80 text-accent-foreground text-xs rounded hover:brightness-110 transition-all flex items-center justify-center gap-1"
              >
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white truncate">{image.title}</p>
              <p className="text-xs text-white/70">{(image.size / 1024 / 1024).toFixed(2)}MB</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {history.length > 6 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-primary hover:bg-surface rounded-lg transition-colors text-sm"
        >
          Show all {history.length} uploads
        </button>
      )}

      {showAll && history.length > 6 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-secondary hover:bg-surface rounded-lg transition-colors text-sm"
        >
          Show less
        </button>
      )}
    </div>
  )
}
