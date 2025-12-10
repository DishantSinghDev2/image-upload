"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Shortcut {
  key: string
  description: string
  action: () => void
}

export function KeyboardShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?") {
        e.preventDefault()
        setShowHelp(!showHelp)
      }

      shortcuts.forEach(({ key, action }) => {
        if (e.ctrlKey && e.key.toLowerCase() === key.toLowerCase()) {
          e.preventDefault()
          action()
        }
      })
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [shortcuts, showHelp])

  return (
    <AnimatePresence>
      {showHelp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowHelp(false)}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-lg p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              {shortcuts.map(({ key, description }) => (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="text-secondary">{description}</span>
                  <kbd className="px-2 py-1 bg-border rounded font-mono text-xs">Ctrl + {key.toUpperCase()}</kbd>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm text-secondary pt-3 border-t border-border">
                <span>Toggle this help</span>
                <kbd className="px-2 py-1 bg-border rounded font-mono text-xs">?</kbd>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
