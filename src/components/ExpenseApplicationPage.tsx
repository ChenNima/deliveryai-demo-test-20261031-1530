import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExpenseApplicationView } from '@/components/ExpenseApplicationView'

export function ExpenseApplicationPage() {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    document.documentElement.lang = i18n.language === 'en' ? 'en' : 'zh-CN'
    document.title = t('expense.title')
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', t('expense.description'))
  }, [i18n.language, t])
  return <ExpenseApplicationView />
}
