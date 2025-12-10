"use client"

import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { UploadDropzone } from "@/components/upload-dropzone"
import { UploadHistoryWidget } from "@/components/upload-history-widget"
import { getRateLimitConfig } from "@/lib/rate-limit"

export default function UploadPage() {
  const { data: session } = useSession()
  const isUserPro = (session?.user as any)?.isUserPro || false
  const isLoggedIn = !!session
  const config = getRateLimitConfig(isUserPro, isLoggedIn)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Upload Images Instantly
            </h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Fast, secure, and reliable image hosting. {isLoggedIn ? "You can upload up to" : "You can upload up to"}{" "}
              <span className="text-primary font-semibold">{config.maxFileSize / 1024 / 1024}MB</span> per image
              {isUserPro && " with Pro unlimited features"}. {!isLoggedIn && "Sign in for higher limits."}
            </p>
          </div>

          {/* Upload Area */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <UploadDropzone />
            </div>

            {/* Side Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
                <h3 className="font-semibold">Your Plan</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">File Size Limit:</span>
                    <span className="font-semibold text-primary">{config.maxFileSize / 1024 / 1024}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Bulk Upload:</span>
                    <span className="font-semibold text-primary">{config.maxBulkUpload} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Rate Limit:</span>
                    <span className="font-semibold text-primary">{config.requestsPerMinute}/min</span>
                  </div>
                </div>

                {!isUserPro && (
                  <button className="w-full py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:brightness-110 transition-all font-semibold">
                    Upgrade to Pro
                  </button>
                )}
              </div>

              <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
                <h3 className="font-semibold">Supported Formats</h3>
                <ul className="text-sm text-secondary space-y-2">
                  <li>PNG, JPEG, WEBP</li>
                  <li>GIF, SVG, AVIF</li>
                  <li>Automatic optimization</li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Upload History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-lg p-8"
          >
            <UploadHistoryWidget />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
