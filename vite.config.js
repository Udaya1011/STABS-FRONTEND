import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://stabs-backend-1.onrender.com', // Defaults to Render, but can be overridden by local env
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'https://stabs-backend-1.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'https://stabs-backend-1.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    }
  }
})

// Trigger reload 2
