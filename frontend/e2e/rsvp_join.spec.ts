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

    // The "no such insert" branch of app/join/[code]/page.tsx. Matched on a
    // fragment and on the recovery link's destination so a copy tweak to the
    // headline doesn't fail the run.
    await expect(page.locator('h1')).toContainText(/open anything/i)
    await expect(page.locator('a[href="/join"]')).toBeVisible()
  })
})
