import { Redis } from '@upstash/redis'
import dotenv from 'dotenv'

dotenv.config()

const redisUrl = process.env.KV_REST_API_URL
const redisToken = process.env.KV_REST_API_TOKEN

let redis: Redis | null = null

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  })
} else {
  console.warn('Warning: KV_REST_API_URL or KV_REST_API_TOKEN not configured. Redis caching will be mocked.')
}

export const CACHE_KEYS = {
  photoQueue: (eventId: string) => `photo:queue:${eventId}`,
  photoProcessing: (photoId: string) => `photo:processing:${photoId}`,
  aiCuration: (eventId: string, userId: string) => `ai:curation:${eventId}:${userId}`,
  faceEmbedding: (guestId: string) => `face:embedding:${guestId}`,
  albumGenLock: (eventId: string, userId: string) => `album:gen:lock:${eventId}:${userId}`,
  inviteCode: (code: string) => `invite:${code}`,
  uploadRateLimit: (userId: string) => `rate:upload:${userId}`,
  userSession: (userId: string) => `session:${userId}`,
}

export const CACHE_TTL = {
  aiCuration: 3600, // 1 hour
  faceEmbedding: 86400, // 24 hours
  inviteCode: 604800, // 7 days
  session: 3600, // 1 hour
  photoProcessing: 300, // 5 minutes
}

export const redisService = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null
    try {
      return await redis.get<T>(key)
    } catch (e) {
      console.error(`Redis GET error for key ${key}:`, e)
      return null
    }
  },

  async set<T>(key: string, value: T, options?: { ex?: number }): Promise<void> {
    if (!redis) return
    try {
      if (options?.ex) {
        await redis.set(key, value, { ex: options.ex })
      } else {
        await redis.set(key, value)
      }
    } catch (e) {
      console.error(`Redis SET error for key ${key}:`, e)
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return
    try {
      await redis.del(key)
    } catch (e) {
      console.error(`Redis DEL error for key ${key}:`, e)
    }
  },

  async incr(key: string): Promise<number> {
    if (!redis) return 0
    try {
      return await redis.incr(key)
    } catch (e) {
      console.error(`Redis INCR error for key ${key}:`, e)
      return 0
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (!redis) return
    try {
      await redis.expire(key, seconds)
    } catch (e) {
      console.error(`Redis EXPIRE error for key ${key}:`, e)
    }
  }
}
