import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5006',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    }
  },
  build: {
    outDir: 'build',
  }
})

// Trigger reload 2
