import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('Order & Payment Checkout API Routes (Supertest)', () => {
  it('returns 401 Unauthenticated when creating print order without token', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({
        albumId: 'album-123',
        productType: 'hardcover',
        size: 'large',
      })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Unauthorized: No token provided')
  })

  it('rejects unauthenticated requests to razorpay webhook route', async () => {
    const res = await request(app)
      .post('/api/orders/razorpay-webhook')
      .set('x-razorpay-signature', 'invalid_sig')
      .send({
        event: 'payment.captured',
        payload: {},
      })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Unauthorized: No token provided')
  })
})
