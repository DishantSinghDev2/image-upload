export interface RateLimitConfig {
  maxFileSize: number // in bytes
  maxBulkUpload: number
  requestsPerMinute: number
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  anonymous: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxBulkUpload: 5,
    requestsPerMinute: 10,
  },
  user: {
    maxFileSize: 15 * 1024 * 1024, // 15MB
    maxBulkUpload: 10,
    requestsPerMinute: 30,
  },
  pro: {
    maxFileSize: 35 * 1024 * 1024, // 35MB
    maxBulkUpload: 50,
    requestsPerMinute: 100,
  },
}

export function getRateLimitConfig(isUserPro: boolean, isLoggedIn: boolean): RateLimitConfig {
  if (isUserPro) return rateLimitConfigs.pro
  if (isLoggedIn) return rateLimitConfigs.user
  return rateLimitConfigs.anonymous
}
