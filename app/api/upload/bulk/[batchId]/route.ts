import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"

export async function GET(
  request: Request,
  { params }: { params: { batchId: string } }
) {
  // Optional: Add auth check here if you only want logged-in users to check status
  // const session = await getServerSession(authConfig)
  // if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { batchId } = await params

  try {
    const res = await fetch(`https://i.api.dishis.tech/bulk-status/${batchId}`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.IMAGE_HOST_API_KEY || "",
      },
      cache: "no-store" // Important for polling
    })

    if (!res.ok) {
      return Response.json({ success: false, error: "Failed to fetch status" }, { status: 502 })
    }

    const data = await res.json()
    return Response.json(data)
  } catch (error) {
    return Response.json({ success: false, error: "Status check failed" }, { status: 500 })
  }
}