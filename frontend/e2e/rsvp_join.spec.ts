import { test, expect } from '@playwright/test'

test.describe('RSVP & Event Join Flow', () => {
  test('renders join page with invite code entry input', async ({ page }) => {
    await page.goto('/join')

    // Expect page title or heading
    await expect(page.locator('h1')).toContainText(/join an event/i)

    // Check code input
    const codeInput = page.locator('#invite-code')
    await expect(codeInput).toBeVisible()

    await codeInput.fill('WEDDING2026')
    await expect(codeInput).toHaveValue('WEDDING2026')
  })

  test('handles invalid event invite code gracefully', async ({ page }) => {
    await page.goto('/join/INVALIDCODE99')

    // Should show invalid code screen
    await expect(page.locator('h1')).toContainText(/invalid code/i)
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })
})
