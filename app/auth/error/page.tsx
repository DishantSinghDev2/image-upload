"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { AlertCircle, Home } from "lucide-react"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    Callback: "There was an error during authentication. Please try again.",
    OAuthSignin: "Error signing in with OAuth provider. Please try again.",
    OAuthCallback: "Error with OAuth callback. Please try again.",
    Default: "An authentication error occurred. Please try again.",
  }

  const message = errorMessages[error || "Default"] || errorMessages.Default

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md text-center space-y-6"
    >
      <div className="flex justify-center">
        <div className="p-4 bg-destructive/10 rounded-full">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-secondary">{message}</p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </motion.div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="text-center">
            <p className="text-secondary">Loading...</p>
          </div>
        }
      >
        <ErrorContent />
      </Suspense>
    </div>
  )
}
