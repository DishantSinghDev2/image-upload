"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Cloud, Zap, Lock, Share2, ArrowRight, Code } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Ultra-Fast",
    description: "Instant uploads with global CDN delivery",
  },
  {
    icon: Lock,
    title: "Secure",
    description: "End-to-end encryption and secure storage",
  },
  {
    icon: Share2,
    title: "Shareable",
    description: "Easy sharing across all social platforms",
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "RESTful API with comprehensive documentation",
  },
]

const products = [
  {
    name: "FreeCustom.Email",
    description: "Temporary email addresses",
    href: "#",
  },
  {
    name: "DITMail",
    description: "Professional email service",
    href: "#",
  },
  {
    name: "WhatsYour.Info",
    description: "Global profile & SSO",
    href: "#",
  },
  {
    name: "DITAPI",
    description: "All APIs unified",
    href: "#",
  },
  {
    name: "DITools",
    description: "Free dev tools & utilities",
    href: "#",
  },
  {
    name: "Code Execution",
    description: "Execute code safely",
    href: "#",
  },
]

export default function Home() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Ultra-Fast Image
                  </span>
                  <br />
                  <span>Hosting & API</span>
                </h1>
                <p className="text-lg text-secondary max-w-xl">
                  Upload, host, and share images instantly. Built for developers and creators who demand speed,
                  reliability, and simplicity.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:brightness-110 transition-all font-semibold"
                >
                  Start Uploading <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-all font-semibold"
                >
                  API Docs
                </Link>
              </div>

              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="pt-4"
              >
                <p className="text-sm text-secondary">Trusted by thousands of developers worldwide</p>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative h-96 md:h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 rounded-3xl border border-primary/20"
              />
              <div className="relative h-full rounded-3xl border border-border bg-surface/50 flex items-center justify-center overflow-hidden">
                <motion.div
                  animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Cloud className="w-32 h-32 text-primary/40" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-secondary">Everything you need for professional image hosting</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-lg border border-border bg-surface hover:border-primary transition-colors"
              >
                <feature.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Plans for Everyone</h2>
            <p className="text-lg text-secondary">Start free, upgrade when you need more</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                limit: "5MB per file, 5 bulk uploads",
                features: ["No sign-up required", "Basic storage", "Never expires", "API access"],
              },
              {
                name: "Logged In",
                price: "$0",
                limit: "15MB per file, 10 bulk uploads",
                features: ["Whats your.Info SSO", "Extended storage", "Never expires", "Upload history", "API access"],
              },
              {
                name: "Pro",
                price: "$6/mo",
                limit: "35MB per file, 50 bulk uploads",
                features: ["All features", "Custom expiration", "Priority support", "Advanced analytics", "API access"],
                highlighted: true,
              },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-lg border ${
                  plan.highlighted ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-surface"
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold text-primary mb-4">{plan.price}</p>
                <p className="text-sm text-secondary mb-6">{plan.limit}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm flex gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2 rounded-lg font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-110"
                      : "border border-border hover:bg-border"
                  }`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Ecosystem</h2>
            <p className="text-lg text-secondary">Explore our complete suite of tools and APIs</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <motion.a
                key={product.name}
                href={product.href}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-lg border border-border bg-surface hover:border-primary transition-all group"
              >
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-sm text-secondary mb-4">{product.description}</p>
                <span className="text-xs text-primary font-semibold">Learn more →</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-secondary mb-8">
              Join thousands of developers using ImageHost for fast, reliable image hosting.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:brightness-110 transition-all font-semibold"
            >
              Start Uploading <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 text-center text-sm text-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <p>ImageHost by Dishis Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
