"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Menu, Cloud, LogOut, LogIn } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export function Navigation() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border-light bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
            <Cloud className="w-6 h-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ImageHost</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/upload" className="text-text-secondary hover:text-primary transition-colors">
              Upload
            </Link>
            <Link href="/camera" className="text-text-secondary hover:text-primary transition-colors">
              Camera
            </Link>
            <Link href="/docs" className="text-text-secondary hover:text-primary transition-colors">
              API Docs
            </Link>

            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">
                  {session.user?.name}
                  {(session.user as any)?.isUserPro && (
                    <span className="ml-2 px-2 py-1 bg-accent/20 text-accent text-xs rounded">Pro</span>
                  )}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("whatsyourinfo")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 space-y-2"
          >
            <Link href="/upload" className="block px-4 py-2 hover:bg-surface rounded-lg transition-colors">
              Upload
            </Link>
            <Link href="/camera" className="block px-4 py-2 hover:bg-surface rounded-lg transition-colors">
              Camera
            </Link>
            <Link href="/docs" className="block px-4 py-2 hover:bg-surface rounded-lg transition-colors">
              API Docs
            </Link>
            {session ? (
              <button
                onClick={() => signOut()}
                className="w-full text-left px-4 py-2 hover:bg-surface rounded-lg transition-colors text-error"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn("whatsyourinfo")}
                className="w-full text-left px-4 py-2 hover:bg-surface rounded-lg transition-colors text-primary"
              >
                Sign In with WhatsYour.Info
              </button>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  )
}
