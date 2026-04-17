import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL || 'https://x.upstash.io',
  token: process.env.KV_REST_API_TOKEN || 'dummy_token',
})

// Cache keys
export const CACHE_KEYS = {
  // Photo processing queue
  photoQueue: (eventId: string) => `photo:queue:${eventId}`,
  photoProcessing: (photoId: string) => `photo:processing:${photoId}`,
  
  // AI curation cache
  aiCuration: (eventId: string, userId: string) => `ai:curation:${eventId}:${userId}`,
  
  // Face embeddings cache
  faceEmbedding: (guestId: string) => `face:embedding:${guestId}`,
  
  // Album generation lock
  albumGenLock: (eventId: string, userId: string) => `album:gen:lock:${eventId}:${userId}`,
  
  // Event invite code lookup
  inviteCode: (code: string) => `invite:${code}`,
  
  // Rate limiting
  uploadRateLimit: (userId: string) => `rate:upload:${userId}`,
  
  // Session cache
  userSession: (userId: string) => `session:${userId}`,
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  aiCuration: 3600, // 1 hour
  faceEmbedding: 86400, // 24 hours
  inviteCode: 604800, // 7 days
  session: 3600, // 1 hour
  photoProcessing: 300, // 5 minutes
}
