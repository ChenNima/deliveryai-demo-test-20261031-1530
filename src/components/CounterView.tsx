import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const buttonClass =
  'flex h-12 items-center justify-center rounded-xl px-5 text-sm font-bold transition active:scale-95 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili-500'

export function CounterView() {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-screen items-center justify-center bg-rice-100 paper-noise px-4 py-10">
      <section aria-labelledby="counter-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float sm:p-8">
        <h1 id="counter-title" className="text-center text-3xl font-extrabold text-charcoal-900">
          {t('common.counter_title')}
        </h1>
        <p className="mt-2 text-center text-sm text-charcoal-500">{t('common.counter_desc')}</p>

        <div className="mt-8 rounded-2xl bg-rice-100 p-6 text-center">
          <p className="text-sm font-semibold text-charcoal-500">{t('common.counter_current')}</p>
          <p className="mt-2 text-6xl font-extrabold text-chili-500">{count}</p>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {t('common.counter_current')}：{count}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setCount((current) => current + 1)}
            className={`${buttonClass} w-full bg-chili-500 text-white shadow-md hover:bg-chili-600`}
          >
            {t('common.counter_increment')}
          </button>
          <button
            type="button"
            onClick={() => setCount(0)}
            className={`${buttonClass} w-full border border-charcoal-900/10 bg-rice-200 text-charcoal-900 hover:bg-amber-100`}
          >
            {t('common.counter_reset')}
          </button>
        </div>
      </section>
    </main>
  )
}
