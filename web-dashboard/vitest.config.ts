/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    execArgv: ['--no-warnings'],
    setupFiles: ['./src/__ui_tests__/setup.ts'],
    include: [
      'src/__ui_tests__/**/*.test.{ts,tsx}',
      'src/layouts/**/*.test.{ts,tsx}',
      'src/app/**/*.test.{ts,tsx}',
      'src/hooks/**/*.test.{ts,tsx}',
    ],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
