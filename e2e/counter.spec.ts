import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // 固定验收语言，避免历史 localStorage 导致用例随环境语言漂移。
  await page.addInitScript(() => window.localStorage.setItem('i18nextLng', 'zh'))
})

test.describe('静态计数器页面', () => {
  test('REQ-001: 初始计数为 0，并提供可访问状态播报', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '静态计数器' })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('当前计数：0')
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    await expect(page.getByRole('status')).toHaveAttribute('aria-atomic', 'true')
  })

  test('REQ-002: 点击“加一”后计数连续递增', async ({ page }) => {
    await page.goto('/')
    const increment = page.getByRole('button', { name: '加一' })
    await increment.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：1')
    await increment.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：2')
  })

  test('REQ-003: 点击“重置”后计数回到 0，且重复重置保持稳定', async ({ page }) => {
    await page.goto('/')
    const increment = page.getByRole('button', { name: '加一' })
    await increment.click()
    await increment.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：2')

    const reset = page.getByRole('button', { name: '重置' })
    await reset.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：0')
    await reset.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：0')
  })

  test('REQ-004: Tab 可聚焦控件，Enter/Space 可激活，焦点标识清晰可见', async ({ page }) => {
    await page.goto('/')
    const increment = page.getByRole('button', { name: '加一' })
    const reset = page.getByRole('button', { name: '重置' })

    await page.keyboard.press('Tab')
    await expect(increment).toBeFocused()
    // Chromium 将系统焦点环计算为 outline-style: auto；断言可见焦点环的实际宽度/颜色/偏移。
    await expect(increment).toHaveCSS('outline-width', '2px')
    await expect(increment).toHaveCSS('outline-color', 'rgb(225, 59, 43)')
    await expect(increment).toHaveCSS('outline-offset', '2px')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toHaveText('当前计数：1')

    await page.keyboard.press('Tab')
    await expect(reset).toBeFocused()
    await expect(reset).toHaveCSS('outline-width', '2px')
    await expect(reset).toHaveCSS('outline-color', 'rgb(225, 59, 43)')
    await expect(reset).toHaveCSS('outline-offset', '2px')
    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText('当前计数：0')
  })

  test('REQ-005: 360px 移动视口无横向滚动，布局可用，触控目标达标', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 720 })
    await page.goto('/')

    const increment = page.getByRole('button', { name: '加一' })
    const reset = page.getByRole('button', { name: '重置' })
    await expect(page.getByRole('heading', { name: '静态计数器' })).toBeVisible()
    await expect(increment).toBeVisible()
    await expect(reset).toBeVisible()

    const scrollable = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(scrollable).toBe(false)

    const [incrementBox, resetBox] = await Promise.all([increment.boundingBox(), reset.boundingBox()])
    expect(incrementBox?.width).toBeGreaterThanOrEqual(44)
    expect(incrementBox?.height).toBeGreaterThanOrEqual(44)
    expect(resetBox?.width).toBeGreaterThanOrEqual(44)
    expect(resetBox?.height).toBeGreaterThanOrEqual(44)

    await increment.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：1')
    await reset.click()
    await expect(page.getByRole('status')).toHaveText('当前计数：0')
  })
})
