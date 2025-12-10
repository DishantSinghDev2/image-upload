import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"
import { getRateLimitConfig } from "@/lib/rate-limit"
import crypto from "crypto"
import { headers } from "next/headers"

// Simple in-memory rate limiter (same logic as your original POST route)
// Note: In production with multiple instances (Vercel), this is per-instance. 
// For strict limits, use Redis (Upstash).
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, requestsPerMinute: number) {
  const now = Date.now()
  const limit = rateLimitMap.get(key)

  if (!limit || limit.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60_000 })
    return true
  }

  if (limit.count < requestsPerMinute) {
    limit.count++
    return true
  }

  return false
}

export async function GET(request: Request) {
  const session = await getServerSession(authConfig)
  
  // 1. Determine User Status (don't block if null)
  const isUserPro = (session?.user as any)?.isUserPro || false
  const isLoggedIn = !!session

  // 2. Get Rate Limit Config
  // Ensure your getRateLimitConfig handles (false, false) correctly for anonymous users
  const config = getRateLimitConfig(isUserPro, isLoggedIn)

  // 3. Identify the user
  // If logged in: use Email. If anonymous: use IP address.
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "127.0.0.1"
  const limiterKey = session?.user?.email || ip

  // 4. Check Rate Limit
  if (!checkRateLimit(limiterKey, config.requestsPerMinute)) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again later." }, 
      { status: 429 }
    )
  }

  // 5. Generate Token
  const secret = process.env.DELETE_SECRET || ""
  const timestamp = Math.floor(Date.now() / 1000)
  
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`upload:${timestamp}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return Response.json({ 
    timestamp, 
    signature,
    endpoint: "https://i.api.dishis.tech/bulk-upload" 
  })
}