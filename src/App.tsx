import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExpenseApplicationView } from '@/components/ExpenseApplicationView'

export default function App() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'en' ? 'en' : 'zh-CN'
    document.title = t('common.title')
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', t('common.meta_desc'))
  }, [i18n.language, t])

  return <ExpenseApplicationView />
}
