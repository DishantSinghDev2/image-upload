export interface UploadResponse {
  success: boolean
  data?: {
    id: string
    title: string
    url: string
    display_url: string
    width: string
    height: string
    size: string
    delete_url: string
    expiration: string
  }
  error?: string
  message?: string
}

export async function uploadImageToServer(formData: FormData): Promise<UploadResponse> {
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

export function generateShareLink(url: string, platform: "twitter" | "facebook" | "linkedin" | "email"): string {
  const encodedUrl = encodeURIComponent(url)
  const text = encodeURIComponent("Check out this image I uploaded on ImageHost!")

  const links = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=Check out this image&body=${encodedUrl}`,
  }

  return links[platform]
}
