"use client"

import { motion } from "framer-motion"
import { Clock } from "lucide-react"

interface ExpirationSelectorProps {
  isProUser: boolean
  onSelect: (days: number | null) => void
  selectedDays: number | null
}

export function ExpirationSelector({ isProUser, onSelect, selectedDays }: ExpirationSelectorProps) {
  const options = [
    { label: "Never expires", days: null },
    { label: "7 days", days: 7 },
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <label className="text-sm font-semibold">Image Expiration</label>
        {!isProUser && <span className="text-xs text-secondary">(Free & Logged-in: Never expires)</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <motion.button
            key={option.days || "never"}
            onClick={() => onSelect(option.days)}
            disabled={!isProUser && option.days !== null}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              selectedDays === option.days
                ? "bg-primary text-primary-foreground"
                : isProUser || option.days === null
                  ? "bg-surface border border-border hover:border-primary"
                  : "bg-surface/50 border border-border/50 opacity-50 cursor-not-allowed"
            }`}
          >
            {option.label}
          </motion.button>
        ))}
      </div>

      {!isProUser && (
        <p className="text-xs text-secondary bg-surface/50 p-2 rounded">
          Pro users can set custom expiration dates. All other plans have images that never expire.
        </p>
      )}
    </div>
  )
}
