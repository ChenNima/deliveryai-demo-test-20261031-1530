import http from 'node:http'
import { randomUUID } from 'node:crypto'

const host = process.env.EXPENSE_API_HOST || '127.0.0.1'
const port = Number(process.env.EXPENSE_API_PORT || 8787)
const applicationsByKey = new Map()

function send(response, statusCode, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
  response.end(body)
}

function fail(response, statusCode, code, message) {
  send(response, statusCode, { error: { code, message } })
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 65536) reject(new Error('payload_too_large'))
    })
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) } catch { reject(new Error('invalid_json')) }
    })
    request.on('error', reject)
  })
}

export function createExpenseServer() {
  return http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      send(response, 200, {})
      return
    }
    if (request.method !== 'POST' || request.url !== '/api/expense-applications') {
      fail(response, 404, 'not_found', 'The requested resource does not exist.')
      return
    }

    let input
    try {
      input = await readJson(request)
    } catch {
      fail(response, 400, 'invalid_json', 'The request body must be valid JSON.')
      return
    }

    if (input.amountCents === undefined || input.idempotencyKey === undefined) {
      fail(response, 400, 'missing_field', 'amountCents and idempotencyKey are required.')
      return
    }
    if (typeof input.idempotencyKey !== 'string' || input.idempotencyKey.trim() === '') {
      fail(response, 400, 'missing_field', 'idempotencyKey must be a non-empty string.')
      return
    }
    if (!Number.isInteger(input.amountCents) || input.amountCents < 1 || input.amountCents > 1000000) {
      fail(response, 400, 'invalid_amount', 'amountCents must be an integer between 1 and 1000000.')
      return
    }

    const key = input.idempotencyKey
    const existing = applicationsByKey.get(key)
    if (existing) {
      if (existing.amountCents !== input.amountCents) {
        fail(response, 409, 'idempotency_conflict', 'The idempotency key is already associated with another amount.')
        return
      }
      send(response, 200, existing)
      return
    }

    const status = input.amountCents >= 100000 ? 'supervisor_pending' : 'approved'
    const application = { id: randomUUID(), amountCents: input.amountCents, status }
    applicationsByKey.set(key, application)
    send(response, 200, application)
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createExpenseServer()
  server.listen(port, host, () => {
    console.log(`Isolated expense service listening on ${host}:${port}`)
  })
}
