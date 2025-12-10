// server route… classic nextjs api style
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"
import { getRateLimitConfig } from "@/lib/rate-limit"
import crypto from "crypto"

// tiny in-memory limiter (redis later, when we’re rich)
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

function getFutureUnixTimestampInDays(days: number) {
  const ms = days * 24 * 60 * 60 * 1000
  return Math.floor((Date.now() + ms) / 1000)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)
    const isUserPro = (session?.user as any)?.isUserPro || false
    const isLoggedIn = !!session

    const config = getRateLimitConfig(isUserPro, isLoggedIn)
    const limiterKey =
      session?.user?.email ||
      request.headers.get("x-forwarded-for") ||
      "anonymous" // hello mr vpn

    if (!checkRateLimit(limiterKey, config.requestsPerMinute)) {
      return Response.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const expirationDays = formData.get("expiration")
      ? Number.parseInt(formData.get("expiration") as string)
      : null

    if (!file) {
      return Response.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      )
    }

    if (file.size > config.maxFileSize) {
      return Response.json(
        {
          success: false,
          error: `File size exceeds limit of ${
            config.maxFileSize / 1024 / 1024
          }MB`,
        },
        { status: 413 },
      )
    }

    if (expirationDays && !isUserPro) {
      return Response.json(
        { success: false, error: "Custom expiration requires Pro plan" },
        { status: 403 },
      )
    }

    const upstreamForm = new FormData()
    upstreamForm.set("image", file)

    // we support custom expiration (only for pro users)
    if (expirationDays) {
      upstreamForm.set(
        "expiration",
        String(getFutureUnixTimestampInDays(expirationDays)),
      )
    }

    // talk to our image host… be gentle
    const res = await fetch("https://i.api.dishis.tech", {
      method: "POST",
      body: upstreamForm,
      headers: {
        "x-api-key": process.env.IMAGE_HOST_API_KEY || "",
      },
    })

    // upstream might return json… or maybe a mysterious “ok”
    const raw = await res.text()
    let resData: any

    try {
      resData = JSON.parse(raw)
    } catch {
      // ah yes… text-only response vibes
      resData = { success: false, message: raw }
    }

    // success should be true… or else doom
    if (!res.ok || !resData.success) {
      return Response.json(resData, { status: 400 })
    }

    return Response.json({
      success: true,
      data: resData.data || resData,
    })
  } catch (err) {
    console.error("upload meltdown:", err)
    return Response.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    )
  }
}
