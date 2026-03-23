import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/openrouter-prices/',
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 3005,
    host: true
  }
})