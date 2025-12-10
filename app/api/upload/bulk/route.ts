import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"
import { getRateLimitConfig } from "@/lib/rate-limit"

export const maxDuration = 60 // Allow longer timeout for bulk forwarding

// Helper to convert days to Unix Timestamp (Seconds)
function getFutureUnixTimestampInDays(days: number) {
  const ms = days * 24 * 60 * 60 * 1000
  return Math.floor((Date.now() + ms) / 1000)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)
    const isUserPro = (session?.user as any)?.isUserPro || false
    const isLoggedIn = !!session
    
    // Check limits
    const config = getRateLimitConfig(isUserPro, isLoggedIn)
    
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const expirationDays = formData.get("expiration") 
      ? Number(formData.get("expiration")) 
      : null

    if (!files || files.length === 0) {
      return Response.json({ success: false, error: "No files provided" }, { status: 400 })
    }

    if (files.length > config.maxBulkUpload) {
      return Response.json(
        { success: false, error: `Too many files. Limit is ${config.maxBulkUpload}` },
        { status: 400 }
      )
    }

    // Forward to upstream
    const upstreamForm = new FormData()
    files.forEach((file) => upstreamForm.append("files[]", file))

    // Handle Expiration Logic
    if (expirationDays) {
      if (!isUserPro) {
         return Response.json({ error: "Pro plan required for custom expiration" }, { status: 403 })
      }
      // Convert days to Unix Timestamp before sending to Worker
      const timestamp = getFutureUnixTimestampInDays(expirationDays)
      upstreamForm.set("expiration", String(timestamp))
    }

    const res = await fetch("https://i.api.dishis.tech/bulk-upload", {
      method: "POST",
      body: upstreamForm,
      headers: {
        "x-api-key": process.env.IMAGE_HOST_API_KEY || "",
      },
    })

    const data = await res.json()

    if (!res.ok || !data.batchId) {
      return Response.json({ success: false, error: "Upstream upload failed" }, { status: 502 })
    }

    // Return the batchId to the client so they can start polling
    return Response.json({ success: true, batchId: data.batchId })

  } catch (err) {
    console.error("Bulk init failed:", err)
    return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}