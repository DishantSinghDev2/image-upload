"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Copy, Check, ExternalLink, Code2 } from "lucide-react"

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: "Your go-to ultra-fast image hosting API. Upload, fetch, and delete images via a single endpoint.",
  },
  {
    id: "authentication",
    title: "Authentication",
    content:
      "To authenticate, users must include the x-rapidapi-key header with your RapidAPI key. This is required for all requests to the API.",
  },
  {
    id: "upload",
    title: "Upload Images",
    content: "Upload images in multiple formats - file, base64, remote URL, data URI, or self-URLs.",
  },
  {
    id: "delete",
    title: "Delete Images",
    content: "Use the delete_url returned in the upload response to permanently remove files from storage.",
  },
  {
    id: "limits",
    title: "Rate Limits",
    content: "Rate limits are based on your plan - Free: 10 req/min, User: 30 req/min, Pro: 100 req/min.",
  },
]

const examples = [
  {
    title: "Upload via File (multipart/form-data)",
    language: "bash",
    code: `curl -X POST https://upload-images-hosting-get-url.p.rapidapi.com/upload \\
  -H "x-rapidapi-key: YOUR_API_KEY" \\
  -F "image=@/path/to/image.jpg" \\
  -F "name=my-image" \\
  -F "expiration=0"`,
  },
  {
    title: "Upload via URL (JSON)",
    language: "bash",
    code: `curl -X POST https://upload-images-hosting-get-url.p.rapidapi.com/upload \\
  -H "x-rapidapi-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "https://example.com/image.jpg",
    "name": "remote-image",
    "expiration": 0
  }'`,
  },
  {
    title: "JavaScript/Node.js",
    language: "javascript",
    code: `const formData = new FormData();
formData.append('image', imageFile);
formData.append('name', 'my-image');
formData.append('expiration', '0');

const response = await fetch(
  'https://upload-images-hosting-get-url.p.rapidapi.com/upload',
  {
    method: 'POST',
    headers: {
      'x-rapidapi-key': 'YOUR_API_KEY'
    },
    body: formData
  }
);

const data = await response.json();
console.log(data.data.url);`,
  },
  {
    title: "Response Format",
    language: "json",
    code: `{
  "success": true,
  "status": 200,
  "data": {
    "id": "abc123",
    "title": "my-image",
    "url": "https://i.dishis.tech/i/abc123",
    "display_url": "https://i.api.dishis.tech/i/abc123",
    "width": "1920",
    "height": "1080",
    "size": "524288",
    "delete_url": "https://i.api.dishis.tech/delete/abc123/token",
    "expiration": "0"
  }
}`,
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview")
  const [copiedCode, setCopiedCode] = useState<string>("")

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(""), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              API Documentation
            </h1>
            <p className="text-lg text-secondary max-w-2xl">
              Fast, secure image hosting API with comprehensive documentation. Get started in minutes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://rapidapi.com/dishis-technologies-dishis-technologies-default/api/upload-images-hosting-get-url"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-surface border border-border rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">RapidAPI Endpoint</h3>
                <ExternalLink className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-secondary">https://upload-images-hosting-get-url.p.rapidapi.com/upload</p>
            </a>

            <div className="p-6 bg-surface border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Base URL</h3>
              <p className="text-sm text-secondary">
                <code className="bg-background px-2 py-1 rounded text-primary">https://i.api.dishis.tech</code>
              </p>
            </div>

            <div className="p-6 bg-surface border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-secondary">
                Header: <code className="bg-background px-2 py-1 rounded text-primary">x-rapidapi-key</code>
              </p>
            </div>
          </div>

          {/* Main Documentation */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-20 space-y-2">
                <h3 className="text-sm font-semibold text-secondary mb-4">Sections</h3>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-surface text-secondary hover:text-foreground"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Section Content */}
              {sections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0 }}
                  animate={activeSection === section.id ? { opacity: 1 } : { opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className={activeSection === section.id ? "block" : "hidden"}
                >
                  <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
                  <p className="text-lg text-secondary mb-6">{section.content}</p>

                  {section.id === "overview" && (
                    <div className="space-y-4 text-secondary">
                      <div>
                        <h4 className="font-semibold mb-2 text-foreground">What This API Can Do</h4>
                        <ul className="space-y-2 ml-4">
                          <li>• Upload images (file, base64, remote URL, data URI)</li>
                          <li>• Retrieve direct image URLs</li>
                          <li>• Delete images via secure delete link</li>
                          <li>• Automatic caching for fast delivery</li>
                          <li>• Optional expiration for auto-delete</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {section.id === "upload" && (
                    <div className="space-y-4 text-secondary">
                      <div>
                        <h4 className="font-semibold mb-2 text-foreground">Supported Formats</h4>
                        <div className="grid md:grid-cols-2 gap-4 ml-4 mb-6">
                          <div>
                            <h5 className="font-semibold mb-1 text-foreground">Input Types</h5>
                            <ul className="text-sm space-y-1">
                              <li>• File Upload (multipart)</li>
                              <li>• Base64 String</li>
                              <li>• Data URI</li>
                              <li>• Remote URL</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-semibold mb-1 text-foreground">Image Types</h5>
                            <ul className="text-sm space-y-1">
                              <li>• PNG, JPEG, WEBP</li>
                              <li>• GIF, SVG, AVIF</li>
                              <li>• Auto-detected MIME</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface border border-border rounded-lg p-6">
                        <h4 className="font-semibold mb-3 text-foreground">Required Fields</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2">Field</th>
                              <th className="text-left py-2">Type</th>
                              <th className="text-left py-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border">
                              <td className="py-2 text-primary">image</td>
                              <td>File/String</td>
                              <td>Image data (required)</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="py-2">name</td>
                              <td>String</td>
                              <td>Custom filename (optional)</td>
                            </tr>
                            <tr>
                              <td className="py-2">expiration</td>
                              <td>Number</td>
                              <td>Seconds or Unix timestamp (optional)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {section.id === "limits" && (
                    <div className="bg-surface border border-border rounded-lg p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Free Plan</h4>
                          <ul className="text-sm space-y-2">
                            <li>5 MB per file</li>
                            <li>5 files bulk</li>
                            <li>10 req/min</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Logged In</h4>
                          <ul className="text-sm space-y-2">
                            <li>15 MB per file</li>
                            <li>10 files bulk</li>
                            <li>30 req/min</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Pro Plan</h4>
                          <ul className="text-sm space-y-2">
                            <li>35 MB per file</li>
                            <li>50 files bulk</li>
                            <li>100 req/min</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Code Examples */}
              <div className="space-y-6 py-12 border-t border-border">
                <h2 className="text-3xl font-bold">Code Examples</h2>

                {examples.map((example) => (
                  <motion.div
                    key={example.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-primary" />
                      {example.title}
                    </h3>

                    <div className="relative">
                      <pre className="bg-background border border-border rounded-lg p-6 text-sm overflow-x-auto">
                        <code className="text-primary">{example.code}</code>
                      </pre>

                      <button
                        onClick={() => copyToClipboard(example.code, example.title)}
                        className="absolute top-4 right-4 p-2 bg-surface hover:bg-border rounded transition-colors"
                      >
                        {copiedCode === example.title ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4 text-secondary" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Error Responses */}
              <div className="space-y-4 py-8 border-t border-border">
                <h2 className="text-2xl font-bold">Error Responses</h2>
                <div className="grid gap-4">
                  {[
                    { code: 400, message: "Invalid request or missing image field" },
                    { code: 401, message: "Unauthorized - missing or invalid API key" },
                    { code: 413, message: "File size exceeds limit for your plan" },
                    { code: 429, message: "Rate limit exceeded" },
                    { code: 500, message: "Server error - please try again" },
                  ].map((error) => (
                    <div key={error.code} className="p-4 bg-surface border border-border rounded-lg">
                      <p className="text-destructive font-semibold mb-1">Error {error.code}</p>
                      <p className="text-sm text-secondary">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-20 p-8 bg-surface border border-border rounded-lg text-center space-y-4"
          >
            <h3 className="text-2xl font-bold">Ready to Integrate?</h3>
            <p className="text-secondary max-w-xl mx-auto">
              Get your API key from RapidAPI and start uploading images programmatically.
            </p>
            <a
              href="https://rapidapi.com/dishis-technologies-dishis-technologies-default/api/upload-images-hosting-get-url"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:brightness-110 transition-all font-semibold"
            >
              Get API Key <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
