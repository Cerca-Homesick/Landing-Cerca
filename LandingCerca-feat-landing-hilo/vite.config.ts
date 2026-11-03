import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { BRAND_NAME } from './src/brand.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'brand-name',
      transformIndexHtml: (html) => html.replaceAll('%BRAND_NAME%', BRAND_NAME),
    },
  ],
})
