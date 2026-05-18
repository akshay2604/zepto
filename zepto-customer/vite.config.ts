import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/stream':    'http://localhost:8080',
      '/analytics': 'http://localhost:8080',
      '/orders':    'http://localhost:8080',
      '/users':      'http://localhost:8080',
      '/warehouses': 'http://localhost:8080',
      '/inventory': 'http://localhost:8080',
      '/catalog':   'http://localhost:8080',
      '/payments':  'http://localhost:8080',
      '/system':    'http://localhost:8080',
    },
  },
})
