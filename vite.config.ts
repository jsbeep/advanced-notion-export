import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app under /<repo>/, so assets must resolve against that sub-path.
  base: '/advanced-notion-export/',
  plugins: [react()],
})
