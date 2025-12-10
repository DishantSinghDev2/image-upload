import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"
import { getRateLimitConfig } from "@/lib/rate-limit"
import crypto from "crypto"

// In-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, requestsPerMinute: number): boolean {
  const now = Date.now()
  const limitData = rateLimitMap.get(key)

  if (!limitData || limitData.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 })
    return true
  }

  if (limitData.count < requestsPerMinute) {
    limitData.count++
    return true
  }

  return false
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)
    const isUserPro = (session?.user as any)?.isUserPro || false
    const isLoggedIn = !!session

    const config = getRateLimitConfig(isUserPro, isLoggedIn)
    const limiterKey = session?.user?.email || request.headers.get("x-forwarded-for") || "anonymous"

    if (!checkRateLimit(limiterKey, config.requestsPerMinute)) {
      return Response.json({ success: false, error: "Rate limit exceeded" }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const expirationDays = formData.get("expiration") ? Number.parseInt(formData.get("expiration") as string) : null

    if (!file) {
      return Response.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (file.size > config.maxFileSize) {
      return Response.json(
        { success: false, error: `File size exceeds limit of ${config.maxFileSize / 1024 / 1024}MB` },
        { status: 413 },
      )
    }

    if (expirationDays && !isUserPro) {
      return Response.json({ success: false, error: "Custom expiration requires Pro plan" }, { status: 403 })
    }

    // Generate unique ID
    const fileId = crypto.randomBytes(6).toString("hex")
    const buffer = await file.arrayBuffer()

    const expirationDate = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      : "never"

    // Here you would send to i.api.dishis.tech
    // For now, we'll prepare the data structure
    const uploadData = {
      id: fileId,
      title: file.name.split(".")[0],
      url: `https://i.dishis.tech/i/${fileId}`,
      display_url: `https://i.api.dishis.tech/i/${fileId}`,
      size: file.size.toString(),
      timestamp: Date.now(),
      expiration: expirationDate,
      success: true,
    }

    return Response.json({
      success: true,
      data: uploadData,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return Response.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}
