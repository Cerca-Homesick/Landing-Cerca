import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { BRAND_NAME } from './src/brand.ts'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // La landing y el aviso de privacidad en ES y EN (F1).
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacidad: resolve(import.meta.dirname, 'privacidad/index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
      },
    },
  },
  plugins: [
    react(),
    {
      name: 'brand-name',
      transformIndexHtml: (html) => html.replaceAll('%BRAND_NAME%', BRAND_NAME),
    },
  ],
})
