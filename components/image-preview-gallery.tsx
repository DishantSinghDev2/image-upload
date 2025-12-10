"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn } from "lucide-react"

interface ImageFile {
  id: string
  file: File
  preview: string
  size: number
}

interface ImagePreviewGalleryProps {
  files: ImageFile[]
  onRemove: (id: string) => void
}

export function ImagePreviewGallery({ files, onRemove }: ImagePreviewGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null)

  if (files.length === 0) return null

  return (
    <>
      {/* Grid Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {files.map((imageFile) => (
            <motion.div
              key={imageFile.id}
              layoutId={imageFile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-border group cursor-pointer"
              onClick={() => setSelectedImage(imageFile)}
            >
              <img
                src={imageFile.preview || "/placeholder.svg"}
                alt={imageFile.file.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(imageFile)
                  }}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all"
                  title="View larger"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(imageFile.id)
                  }}
                  className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:brightness-110 transition-all"
                  title="Remove"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {(imageFile.size / 1024 / 1024).toFixed(2)}MB
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              layoutId={selectedImage.id}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              <img
                src={selectedImage.preview || "/placeholder.svg"}
                alt={selectedImage.file.name}
                className="w-full h-full object-contain rounded-lg"
              />

              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
                <p className="font-semibold text-sm">{selectedImage.file.name}</p>
                <p className="text-xs text-gray-300 mt-1">Size: {(selectedImage.size / 1024 / 1024).toFixed(2)}MB</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
