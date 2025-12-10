"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Cloud } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-surface border border-border rounded-lg">
              <Cloud className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">ImageHost</h1>
          <p className="text-secondary">Sign in to access your account</p>
        </div>

        {/* Sign In Form */}
        <div className="space-y-4">
          <button
            onClick={() => signIn("wyi", { callbackUrl: "/upload" })}
            className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:brightness-110 transition-all font-semibold"
          >
            Sign In with WhatsYour.Info
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-secondary">or continue as guest</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/upload")}
            className="w-full py-3 border border-border text-foreground rounded-lg hover:bg-surface transition-all font-semibold"
          >
            Continue as Guest
          </button>
        </div>

        {/* Features */}
        <div className="p-6 bg-surface border border-border rounded-lg space-y-4">
          <h3 className="font-semibold text-center">Benefits of Signing In</h3>
          <ul className="space-y-2 text-sm text-secondary">
            <li className="flex gap-2">
              <span className="text-primary">✓</span> Increase upload limit to 15MB per file
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span> Upload up to 10 files in bulk
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span> Save upload history
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span> Upgrade to Pro for 35MB limit
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-secondary">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </motion.div>
    </div>
  )
}
