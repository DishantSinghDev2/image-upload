export interface UploadedImage {
  id: string
  title: string
  url: string
  size: number
  timestamp: number
  expiration?: number
  deleteUrl?: string
}

const STORAGE_KEY = "image_hosting_history"
const MAX_HISTORY_ITEMS = 100

export function getUploadHistory(): UploadedImage[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addToHistory(image: UploadedImage): void {
  if (typeof window === "undefined") return

  try {
    const history = getUploadHistory()
    history.unshift(image)
    // Keep only last 100 items
    const limited = history.slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error("Failed to save upload history:", error)
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear history:", error)
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === "undefined") return

  try {
    const history = getUploadHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Failed to remove from history:", error)
  }
}
