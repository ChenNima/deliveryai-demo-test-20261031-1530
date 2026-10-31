import { useId, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

const base = (import.meta.env.VITE_EXPENSE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8787'
const endpoint = `${base.replace(/\/$/, '')}/api/expense-applications`

const inputClass =
  'h-12 w-full rounded-xl border border-charcoal-900/10 bg-rice-50 px-4 text-sm text-charcoal-900 outline-none transition focus:border-chili-500 focus:ring-2 focus:ring-chili-100 disabled:cursor-not-allowed disabled:opacity-50'
const buttonClass =
  'flex h-12 items-center justify-center rounded-xl px-5 text-sm font-bold transition active:scale-95 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili-500 disabled:cursor-not-allowed disabled:opacity-50'

type ExpenseApplicationResult = {
  id: string
  amountCents: number
  status: 'approved' | 'supervisor_pending'
}

type ExpenseApplicationError = {
  code?: string
  message?: string
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function buildAmountCents(value: string): number | string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) ? parsed : trimmed
}

function isExpenseApplicationResult(value: unknown): value is ExpenseApplicationResult {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.amountCents === 'number' &&
    Number.isInteger(record.amountCents) &&
    (record.status === 'approved' || record.status === 'supervisor_pending')
  )
}

function getApiError(value: unknown): ExpenseApplicationError | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (typeof record.error === 'object' && record.error !== null) {
    const error = record.error as Record<string, unknown>
    return {
      code: typeof error.code === 'string' ? error.code : undefined,
      message: typeof error.message === 'string' ? error.message : undefined,
    }
  }
  const code = typeof record.code === 'string' ? record.code : undefined
  const message = typeof record.message === 'string' ? record.message : undefined
  return code || message ? { code, message } : null
}

export function ExpenseApplicationView() {
  const { t } = useTranslation()
  const amountId = useId()
  const idempotencyKeyId = useId()
  const [amount, setAmount] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey)
  const [result, setResult] = useState<ExpenseApplicationResult | null>(null)
  const [error, setError] = useState<ExpenseApplicationError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    if (next === amount) return
    setAmount(next)
    setIdempotencyKey(createIdempotencyKey())
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setResult(null)
    setError(null)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amountCents: buildAmountCents(amount),
          idempotencyKey,
        }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const apiError = getApiError(payload)
        setError(apiError ?? { code: 'request_failed', message: t('expense.invalid_response') })
        return
      }
      if (!isExpenseApplicationResult(payload)) {
        setError({ code: 'invalid_response', message: t('expense.invalid_response') })
        return
      }
      setResult(payload)
    } catch {
      setError({ code: 'network_error', message: t('expense.network_error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusText =
    result?.status === 'approved' ? t('expense.status_approved') : t('expense.status_supervisor_pending')

  return (
    <main className="flex min-h-screen items-center justify-center bg-rice-100 paper-noise px-4 py-10">
      <section
        aria-labelledby="expense-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-float sm:p-8"
      >
        <h1 id="expense-title" className="text-center text-3xl font-extrabold text-charcoal-900">
          {t('expense.title')}
        </h1>
        <p className="mt-2 text-center text-sm text-charcoal-500">{t('expense.description')}</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={amountId} className="text-sm font-semibold text-charcoal-700">
              {t('expense.amount_label')}
            </label>
            <input
              id={amountId}
              name="amountCents"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              disabled={isSubmitting}
              aria-describedby={`${amountId}-hint`}
              className={`${inputClass} mt-2`}
            />
            <p id={`${amountId}-hint`} className="mt-2 text-xs text-charcoal-500">
              {t('expense.amount_hint')}
            </p>
          </div>

          <div>
            <label htmlFor={idempotencyKeyId} className="text-sm font-semibold text-charcoal-700">
              {t('expense.idempotency_key_label')}
            </label>
            <input
              id={idempotencyKeyId}
              type="text"
              value={idempotencyKey}
              readOnly
              disabled={isSubmitting}
              aria-describedby={`${idempotencyKeyId}-hint`}
              className={`${inputClass} mt-2`}
            />
            <p id={`${idempotencyKeyId}-hint`} className="mt-2 text-xs text-charcoal-500">
              {t('expense.idempotency_key_hint')}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${buttonClass} w-full bg-chili-500 text-white shadow-md hover:bg-chili-600`}
          >
            {isSubmitting ? t('expense.submitting') : t('expense.submit')}
          </button>
        </form>

        {result && (
          <section
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-8 rounded-2xl bg-rice-100 p-6"
          >
            <h2 className="text-sm font-bold text-charcoal-700">{t('expense.result_title')}</h2>
            <dl className="mt-3 grid gap-3 text-sm text-charcoal-900 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-charcoal-500">{t('expense.result_id')}</dt>
                <dd className="mt-1 break-all">{result.id}</dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal-500">{t('expense.result_amount')}</dt>
                <dd className="mt-1">{result.amountCents}</dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal-500">{t('expense.result_status')}</dt>
                <dd className="mt-1 font-bold text-chili-500">{statusText}</dd>
              </div>
            </dl>
          </section>
        )}

        {error && (
          <section role="alert" aria-live="assertive" className="mt-8 rounded-2xl bg-chili-50 p-6">
            <h2 className="text-sm font-bold text-chili-700">{t('expense.error_title')}</h2>
            <p className="mt-2 text-sm text-chili-700">{error.message ?? t('expense.invalid_response')}</p>
            {error.code && (
              <p className="mt-1 text-xs text-chili-600">
                {t('expense.error_code')}：{error.code}
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  )
}
