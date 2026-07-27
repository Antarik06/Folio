import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('Events & Auth API Routes (Supertest)', () => {
  it('returns 401 Unauthenticated when getting my-events without auth token', async () => {
    const res = await request(app).get('/api/events/my-events')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Unauthorized: No token provided')
  })

  it('handles invalid invite code lookup gracefully', async () => {
    const res = await request(app).get('/api/events/invite/INVALIDCODE123')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
