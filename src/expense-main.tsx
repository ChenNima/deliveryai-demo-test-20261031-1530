import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import { ExpenseApplicationPage } from '@/components/ExpenseApplicationPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode><ExpenseApplicationPage /></StrictMode>,
)
