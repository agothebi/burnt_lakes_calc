import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    // hooks use React — jsdom; pure utils can run in node but jsdom works for both
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
