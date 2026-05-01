import { test, expect } from '@playwright/test'

test.describe('Movie Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for grid then click the first movie card
    const firstCard = page.locator('a[href^="/movie/"]').first()
    await firstCard.waitFor({ timeout: 10000 })
    await firstCard.click()
  })

  test('navigates to movie detail page', async ({ page }) => {
    await expect(page).toHaveURL(/\/movie\//)
  })

  test('shows movie title, year, and genres', async ({ page }) => {
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 8000 })

    // Year in 4-digit format
    await expect(page.getByText(/\b(19|20)\d{2}\b/)).toBeVisible()
  })

  test('shows Sentiment Analysis section heading', async ({ page }) => {
    await expect(page.getByText('Sentiment Analysis')).toBeVisible({ timeout: 8000 })
  })

  test('renders Hype Meter widget', async ({ page }) => {
    await expect(page.getByText('Hype Meter')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('/ 100')).toBeVisible()
  })

  test('renders AI Confidence gauge', async ({ page }) => {
    await expect(page.getByText('AI Confidence')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('confidence', { exact: true })).toBeVisible()
  })

  test('renders Sentiment Distribution section', async ({ page }) => {
    await expect(page.getByText('Sentiment Distribution')).toBeVisible({ timeout: 10000 })
  })

  test('shows review counts stats bar', async ({ page }) => {
    const statsBar = page.locator('.grid.grid-cols-3').first()
    await expect(statsBar.getByText('Total Reviews')).toBeVisible({ timeout: 10000 })
    await expect(statsBar.getByText('Positive', { exact: true })).toBeVisible()
    await expect(statsBar.getByText('Negative', { exact: true })).toBeVisible()
  })

  test('shows Featured Reviews section', async ({ page }) => {
    await expect(page.getByText('Featured Reviews')).toBeVisible({ timeout: 10000 })
  })

  test('back button returns to home', async ({ page }) => {
    const backBtn = page.getByText('Back to Movies')
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Sentiment Dashboard content', () => {
  test('top reviews section shows positive and negative headers', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('a[href^="/movie/"]').first()
    await firstCard.waitFor({ timeout: 10000 })
    await firstCard.click()

    await expect(page.getByText('Top Positive Reviews')).toBeVisible({ timeout: 12000 })
    await expect(page.getByText('Top Negative Reviews')).toBeVisible()
  })
})
