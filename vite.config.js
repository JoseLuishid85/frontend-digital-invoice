import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // Redirige /bill/api al backend Express para evitar problemas de CORS en desarrollo
      proxy: {
        '/bill/api': env.VITE_PROXY_TARGET || 'http://localhost:4000',
      },
    },
  }
})
