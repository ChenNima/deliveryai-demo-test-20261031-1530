import { expect, test, type APIRequestContext } from '@playwright/test'

const BASE_URL = process.env.EXPENSE_API_BASE_URL || 'http://127.0.0.1:8787'
const ENDPOINT = `${BASE_URL}/api/expense-applications`

function uniqueIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function createExpenseApplication(request: APIRequestContext, body: Record<string, unknown>) {
  return request.post(ENDPOINT, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
}

test.describe('费用申请契约', () => {
  test('REQ-001: 1 分金额自动通过并返回完整成功契约', async ({ request }) => {
    const response = await createExpenseApplication(request, {
      amountCents: 1,
      idempotencyKey: uniqueIdempotencyKey('expense-1'),
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.id).toBeTruthy()
    expect(body.amountCents).toBe(1)
    expect(body.status).toBe('approved')
  })

  test('REQ-002: 99999 分金额自动通过', async ({ request }) => {
    const response = await createExpenseApplication(request, {
      amountCents: 99999,
      idempotencyKey: uniqueIdempotencyKey('expense-99999'),
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('approved')
  })

  test('REQ-003: 100000 分金额进入主管待审', async ({ request }) => {
    const response = await createExpenseApplication(request, {
      amountCents: 100000,
      idempotencyKey: uniqueIdempotencyKey('expense-100000'),
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('supervisor_pending')
  })

  test('REQ-004: 100001 分金额进入主管待审', async ({ request }) => {
    const response = await createExpenseApplication(request, {
      amountCents: 100001,
      idempotencyKey: uniqueIdempotencyKey('expense-100001'),
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('supervisor_pending')
  })

  test('REQ-005: 1000000 分金额进入主管待审', async ({ request }) => {
    const response = await createExpenseApplication(request, {
      amountCents: 1000000,
      idempotencyKey: uniqueIdempotencyKey('expense-1000000'),
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('supervisor_pending')
  })

  test('REQ-006: 缺少 amountCents 返回 missing_field 且不占用幂等键', async ({ request }) => {
    const key = uniqueIdempotencyKey('expense-missing-amount')

    const invalidResponse = await createExpenseApplication(request, { idempotencyKey: key })
    expect(invalidResponse.status()).toBe(400)
    const invalidBody = await invalidResponse.json()
    expect(invalidBody.id).toBeUndefined()
    expect(invalidBody.error.code).toBe('missing_field')
    expect(typeof invalidBody.error.message).toBe('string')

    const validResponse = await createExpenseApplication(request, {
      amountCents: 1,
      idempotencyKey: key,
    })
    expect(validResponse.status()).toBe(200)
  })

  test('REQ-007: 0 分金额返回 invalid_amount 且不占用幂等键', async ({ request }) => {
    const key = uniqueIdempotencyKey('expense-zero')

    const invalidResponse = await createExpenseApplication(request, {
      amountCents: 0,
      idempotencyKey: key,
    })
    expect(invalidResponse.status()).toBe(400)
    const invalidBody = await invalidResponse.json()
    expect(invalidBody.id).toBeUndefined()
    expect(invalidBody.error.code).toBe('invalid_amount')
    expect(typeof invalidBody.error.message).toBe('string')

    const validResponse = await createExpenseApplication(request, {
      amountCents: 1,
      idempotencyKey: key,
    })
    expect(validResponse.status()).toBe(200)
  })

  test('REQ-008: 1000001 分金额返回 invalid_amount 且不占用幂等键', async ({ request }) => {
    const key = uniqueIdempotencyKey('expense-over-limit')

    const invalidResponse = await createExpenseApplication(request, {
      amountCents: 1000001,
      idempotencyKey: key,
    })
    expect(invalidResponse.status()).toBe(400)
    const invalidBody = await invalidResponse.json()
    expect(invalidBody.id).toBeUndefined()
    expect(invalidBody.error.code).toBe('invalid_amount')
    expect(typeof invalidBody.error.message).toBe('string')

    const validResponse = await createExpenseApplication(request, {
      amountCents: 1,
      idempotencyKey: key,
    })
    expect(validResponse.status()).toBe(200)
  })

  test('REQ-009: 非整数金额返回 invalid_amount 且不占用幂等键', async ({ request }) => {
    const key = uniqueIdempotencyKey('expense-float')

    const invalidResponse = await createExpenseApplication(request, {
      amountCents: 1.5,
      idempotencyKey: key,
    })
    expect(invalidResponse.status()).toBe(400)
    const invalidBody = await invalidResponse.json()
    expect(invalidBody.id).toBeUndefined()
    expect(invalidBody.error.code).toBe('invalid_amount')
    expect(typeof invalidBody.error.message).toBe('string')

    const validResponse = await createExpenseApplication(request, {
      amountCents: 1,
      idempotencyKey: key,
    })
    expect(validResponse.status()).toBe(200)
  })

  test('REQ-010: 缺少 idempotencyKey 返回 missing_field', async ({ request }) => {
    const response = await createExpenseApplication(request, { amountCents: 1 })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.id).toBeUndefined()
    expect(body.error.code).toBe('missing_field')
    expect(typeof body.error.message).toBe('string')
  })

  test('REQ-011: 空 idempotencyKey 返回 missing_field', async ({ request }) => {
    const response = await createExpenseApplication(request, {
      amountCents: 1,
      idempotencyKey: '',
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.id).toBeUndefined()
    expect(body.error.code).toBe('missing_field')
    expect(typeof body.error.message).toBe('string')
  })

  test('REQ-012: 同键同金额重复请求返回原 id 与状态', async ({ request }) => {
    const key = uniqueIdempotencyKey('expense-retry')
    const body = { amountCents: 99999, idempotencyKey: key }

    const firstResponse = await createExpenseApplication(request, body)
    expect(firstResponse.status()).toBe(200)
    const firstBody = await firstResponse.json()

    const secondResponse = await createExpenseApplication(request, body)
    expect(secondResponse.status()).toBe(200)
    const secondBody = await secondResponse.json()

    expect(secondBody.id).toBe(firstBody.id)
    expect(secondBody.amountCents).toBe(firstBody.amountCents)
    expect(secondBody.status).toBe(firstBody.status)
  })

  test('REQ-013: 同键不同金额返回 idempotency_conflict 且不覆盖原记录', async ({ request }) => {
    const key = uniqueIdempotencyKey('expense-conflict')

    const firstResponse = await createExpenseApplication(request, {
      amountCents: 99999,
      idempotencyKey: key,
    })
    expect(firstResponse.status()).toBe(200)
    const firstBody = await firstResponse.json()

    const conflictResponse = await createExpenseApplication(request, {
      amountCents: 100000,
      idempotencyKey: key,
    })
    expect(conflictResponse.status()).toBe(409)
    const conflictBody = await conflictResponse.json()
    expect(conflictBody.id).toBeUndefined()
    expect(conflictBody.error.code).toBe('idempotency_conflict')
    expect(typeof conflictBody.error.message).toBe('string')

    const replayResponse = await createExpenseApplication(request, {
      amountCents: 99999,
      idempotencyKey: key,
    })
    expect(replayResponse.status()).toBe(200)
    const replayBody = await replayResponse.json()
    expect(replayBody.id).toBe(firstBody.id)
    expect(replayBody.amountCents).toBe(99999)
    expect(replayBody.status).toBe('approved')
  })
})
