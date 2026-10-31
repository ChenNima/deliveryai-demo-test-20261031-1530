import { expect, test, type APIRequestContext } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'

const BASE_URL = process.env.EXPENSE_API_BASE_URL || 'http://127.0.0.1:8787'
const ENDPOINT = `${BASE_URL}/api/expense-applications`
const key = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`

async function post(request: APIRequestContext, body: unknown, idempotencyKey: string) {
  return request.post(ENDPOINT, { data: { amountCents: body, idempotencyKey } })
}

test.describe('费用申请扩展非法输入', () => {
  for (const [label, value] of ([['负数', -1], ['字符串', '1000'], ['布尔', true], ['null', null]] as const)) {
    test(`${label}金额返回400且不占用幂等键`, async ({ request }) => {
      const k = key('extended-invalid')
      const invalid = await post(request, value, k)
      expect(invalid.status()).toBe(400)
      expect((await invalid.json()).error.code).toBe('invalid_amount')
      const valid = await post(request, 1, k)
      expect(valid.status()).toBe(200)
    })
  }

  test('非法JSON返回400且不创建记录', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: '{"amountCents":',
      headers: { 'Content-Type': 'application/json', 'idempotency-key': key('invalid-json') },
    })
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('invalid_json')
  })
})

async function waitForService(port: number) {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/expense-applications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      if (response.status === 400) return
    } catch { /* Service is not ready yet. */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('isolated service did not start')
}

async function stopService(child: ChildProcess) {
  child.kill()
  await new Promise<void>((resolve) => child.once('exit', () => resolve()))
}

test('进程重启清空记录与幂等键', async () => {
  const port = 8791
  const env = { ...process.env, EXPENSE_API_PORT: String(port) }
  let child = spawn(process.execPath, ['isolated-expense/service.mjs'], { env, stdio: 'ignore' })
  try {
    await waitForService(port)
    const body = { amountCents: 99999, idempotencyKey: key('restart') }
    const first = await fetch(`http://127.0.0.1:${port}/api/expense-applications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const firstBody = await first.json()
    await stopService(child)
    child = spawn(process.execPath, ['isolated-expense/service.mjs'], { env, stdio: 'ignore' })
    await waitForService(port)
    const second = await fetch(`http://127.0.0.1:${port}/api/expense-applications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const secondBody = await second.json()
    expect(secondBody.id).not.toBe(firstBody.id)
  } finally {
    if (child.exitCode === null) await stopService(child)
  }
})

test.describe('隔离费用页面与旧Demo保护', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('i18nextLng', 'zh'))
  })

  test('网络失败不显示成功，重试复用键，换金额换键', async ({ page }) => {
    await page.route('**/api/expense-applications', (route) => route.abort())
    await page.goto('/expense.html')
    const amount = page.getByLabel('申请金额（分）')
    const keyInput = page.locator('input[readonly]')
    await amount.fill('99999')
    const originalKey = await keyInput.inputValue()
    await page.getByRole('button', { name: '提交申请' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0)
    await expect(page.getByText('已通过', { exact: true })).toHaveCount(0)

    await page.unroute('**/api/expense-applications')
    await page.getByRole('button', { name: '提交申请' }).click()
    await expect(page.getByRole('status')).toContainText('已通过')
    expect(await keyInput.inputValue()).toBe(originalKey)

    await amount.fill('100000')
    expect(await keyInput.inputValue()).not.toBe(originalKey)
    await page.getByRole('button', { name: '提交申请' }).click()
    await expect(page.getByRole('status')).toContainText('待主管审批')
  })

  test('键盘提交与移动宽度下100000显示待审', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/expense.html')
    await page.getByLabel('申请金额（分）').fill('100000')
    await page.getByRole('button', { name: '提交申请' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toContainText('待主管审批')
    const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }))
    expect(widths.body).toBeLessThanOrEqual(widths.viewport)
  })
})
