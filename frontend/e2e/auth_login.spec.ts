import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('renders login page with email and password inputs', async ({ page }) => {
    await page.goto('/auth/login')

    // Check brand heading
    await expect(page.locator('h1')).toContainText(/welcome back/i)

    // Check form inputs
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    // Test typing input
    await emailInput.fill('user@folio.com')
    await passwordInput.fill('password123')

    await expect(emailInput).toHaveValue('user@folio.com')
  })

  test('navigates to sign-up page from login', async ({ page }) => {
    await page.goto('/auth/login')

    // Matched on destination rather than label: the footer wording is design
    // surface and has been reworded ("Create one" -> "Make one") before.
    const signUpLink = page.locator('a[href^="/auth/sign-up"]')
    await expect(signUpLink).toBeVisible()

    await signUpLink.click()
    await expect(page).toHaveURL(/\/auth\/sign-up/)
  })
})
