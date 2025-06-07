import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      'xact-matcher-shared': resolve(__dirname, '../../packages/shared/dist/esm/index.js')
    }
  }
})
