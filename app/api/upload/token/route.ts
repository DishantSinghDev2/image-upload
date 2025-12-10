import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"
import crypto from "crypto"

export async function GET() {
  const session = await getServerSession(authConfig)
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Use the same DELETE_SECRET stored in your .env.local
  const secret = process.env.DELETE_SECRET || ""
  const timestamp = Math.floor(Date.now() / 1000)
  
  // Create HMAC signature: hmac(secret, "upload:timestamp")
  // Matches the logic we added to the Worker
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`upload:${timestamp}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "") // Make it URL-safe Base64 to match Web Crypto

  return Response.json({ 
    timestamp, 
    signature,
    endpoint: "https://i.api.dishis.tech/bulk-upload" // Your Worker URL
  })
}