import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        expense: resolve(__dirname, 'expense.html'),
      },
    },
  },
})
