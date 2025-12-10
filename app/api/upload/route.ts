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

function getFutureUnixTimestampInDays(daysToAdd: number) {
  const now = Date.now(); // Current timestamp in milliseconds
  const millisecondsToAdd = daysToAdd * 24 * 60 * 60 * 1000;
  const futureTimestampMilliseconds = now + millisecondsToAdd;
  return Math.floor(futureTimestampMilliseconds / 1000);
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
    const newFormData = new FormData()
    newFormData.set('image', file)
    newFormData.set('expiration', String(getFutureUnixTimestampInDays(Number(expirationDays))))

    const expirationDate = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      : "never"

    // Here you would send to i.api.dishis.tech

    const res = await fetch('https://i.api.dishis.tech', {
      method: 'POST',
      body: newFormData,
      headers: {
        'x-api-key': process.env.IMAGE_HOST_API_KEY
      }
    })

    const resData = await res.json()
    if (!res.ok || resData.success)
      return Response.json(resData || { success: false }, { status: 400 })

    const uploadData = resData.data

    return Response.json({
      success: true,
      data: uploadData,
    })
  } catch (error) {
    console.error(" Upload error:", error)
    return Response.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}
