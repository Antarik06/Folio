import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('GET /health API Endpoint', () => {
  it('returns 200 OK with status and timestamp', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await request(app).get('/api/non-existent-route-99')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
