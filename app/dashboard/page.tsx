"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { UploadHistoryWidget } from "@/components/upload-history-widget"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { BarChart3, Settings, Upload } from "lucide-react"
import type { UploadedImage } from "@/lib/upload-history"
import { getUploadHistory, clearHistory } from "@/lib/upload-history"

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<UploadedImage[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [customShortcuts, setCustomShortcuts] = useState<Record<string, string>>({
    upload: "u",
    camera: "c",
    share: "s",
  })

  useEffect(() => {
    if (!session) {
      signIn("whatsyourinfo")
    } else {
      setHistory(getUploadHistory())
      const saved = localStorage.getItem("custom_shortcuts")
      if (saved) setCustomShortcuts(JSON.parse(saved))
    }
  }, [session])

  const handleSaveShortcuts = () => {
    localStorage.setItem("custom_shortcuts", JSON.stringify(customShortcuts))
  }

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all upload history?")) {
      clearHistory()
      setHistory([])
    }
  }

  const shortcuts = [
    {
      key: customShortcuts.upload,
      description: "Go to upload",
      action: () => router.push("/upload"),
    },
    {
      key: customShortcuts.camera,
      description: "Open camera",
      action: () => router.push("/camera"),
    },
    {
      key: customShortcuts.share,
      description: "Share current",
      action: () => {},
    },
  ]

  const stats = [
    { label: "Total Uploads", value: history.length },
    {
      label: "Total Size",
      value: `${(history.reduce((acc, img) => acc + img.size, 0) / 1024 / 1024).toFixed(2)}MB`,
    },
    { label: "Plan", value: (session?.user as any)?.isUserPro ? "Pro" : "Free" },
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-lg text-secondary">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <KeyboardShortcuts shortcuts={shortcuts} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-secondary">Welcome back, {session.user?.name}!</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-surface rounded-lg border border-border hover:border-primary transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-surface border border-border rounded-lg"
              >
                <p className="text-secondary text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 bg-surface border border-border rounded-lg space-y-6"
            >
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h3>

                {/* Keyboard Shortcuts */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
                  <div className="space-y-3">
                    {Object.entries(customShortcuts).map(([action, key]) => (
                      <div key={action} className="flex items-center gap-4">
                        <label className="capitalize text-sm w-20">{action}:</label>
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => setCustomShortcuts({ ...customShortcuts, [action]: e.target.value })}
                          maxLength={1}
                          className="px-2 py-1 bg-background border border-border rounded font-mono w-12"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveShortcuts}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:brightness-110 transition-all"
                  >
                    Save Shortcuts
                  </button>
                </div>

                {/* History Management */}
                <div className="pt-6 border-t border-border space-y-4">
                  <h4 className="font-semibold text-sm">History Management</h4>
                  <button
                    onClick={handleClearHistory}
                    className="w-full px-4 py-2 border border-destructive text-destructive rounded hover:bg-destructive/10 transition-all text-sm"
                  >
                    Clear All History
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.a
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              href="/upload"
              className="p-6 bg-surface border border-border rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <Upload className="w-8 h-8 text-primary" />
                <span className="text-xs text-secondary">Ctrl+U</span>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Upload Images</h3>
              <p className="text-sm text-secondary">Drag, drop, or select images to upload</p>
            </motion.a>

            <motion.a
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              href="/camera"
              className="p-6 bg-surface border border-border rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-accent" />
                <span className="text-xs text-secondary">Ctrl+C</span>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Camera Capture</h3>
              <p className="text-sm text-secondary">Take photos directly from your device</p>
            </motion.a>
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

          {/* Keyboard Help */}
          <div className="text-center text-sm text-secondary">
            <p>
              Press <kbd className="px-2 py-1 bg-border rounded font-mono">?</kbd> to view keyboard shortcuts
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
