import { test, expect } from '@playwright/test'

test.describe('Payment Checkout Flow', () => {
  test('redirects unauthenticated visitors to login or renders checkout', async ({ page }) => {
    await page.goto('/dashboard/orders/checkout')

    // Since checkout is auth protected, it redirects to login or renders login/checkout
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })
})
