import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  // Берем базу из переменной окружения, либо оставляем корень
  base: process.env.VITE_BASE || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // ES2020 — современные браузеры, минимум транспиляции (меньше кода в бандле)
    target: 'es2020',
    // Печатать gzip-размер в отчёте сборки — удобно контролировать бюджет
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        /**
         * React в отдельном чанке: он не меняется между деплоями клиентов,
         * поэтому при обновлении контента возвращающиеся посетители берут
         * его из кэша. Фичи анимаций (motion-features) остаются отдельным
         * асинхронным чанком — этот фильтр их не затрагивает.
         */
        manualChunks: (id) =>
          id.includes('node_modules/react') || id.includes('node_modules/scheduler')
            ? 'react-vendor'
            : undefined,
      },
    },
  },
})

