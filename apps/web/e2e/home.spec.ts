import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero heading and movie grid', async ({ page }) => {
    await expect(page.getByText('Global Cinema')).toBeVisible()
    await expect(page.getByText('AI-Powered Sentiment Analysis')).toBeVisible()

    // Wait for at least one movie card to load
    const cards = page.locator('a[href^="/movie/"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
  })

  test('navbar shows brand name and BERT badge', async ({ page }) => {
    await expect(page.getByText('CineSentiment')).toBeVisible()
    await expect(page.getByText('BERT AI Model')).toBeVisible()
  })

  test('search filters movies', async ({ page }) => {
    // Wait for grid to load
    await page.locator('a[href^="/movie/"]').first().waitFor()

    const searchInput = page.getByPlaceholder('Search movies...')
    await searchInput.fill('Inception')

    await page.waitForTimeout(600) // debounce

    const cards = page.locator('a[href^="/movie/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // At least one card should mention Inception
    const titles = await page.locator('a[href^="/movie/"] h3').allTextContents()
    expect(titles.some((t) => t.toLowerCase().includes('inception'))).toBe(true)
  })

  test('clearing search restores full grid', async ({ page }) => {
    await page.locator('a[href^="/movie/"]').first().waitFor()

    const searchInput = page.getByPlaceholder('Search movies...')
    await searchInput.fill('Inception')
    await page.waitForTimeout(400)

    await page.locator('button[aria-label="clear"], button:has(svg)').last().click()
    await page.waitForTimeout(400)

    const cards = page.locator('a[href^="/movie/"]')
    expect(await cards.count()).toBeGreaterThan(1)
  })

  test('genre dropdown filters movies', async ({ page }) => {
    await page.locator('a[href^="/movie/"]').first().waitFor()

    const select = page.locator('select')
    await select.selectOption({ index: 1 }) // first non-"All Genres" option

    await page.waitForTimeout(400)

    const cards = page.locator('a[href^="/movie/"]')
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
  })

  test('each movie card shows title and year', async ({ page }) => {
    const firstCard = page.locator('a[href^="/movie/"]').first()
    await firstCard.waitFor()

    const title = firstCard.locator('h3')
    const year = firstCard.getByText(/\d{4}/)

    await expect(title).toBeVisible()
    await expect(year).toBeVisible()
  })
})
