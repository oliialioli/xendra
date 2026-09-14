import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this app from https://<user>.github.io/xendra/, so
  // asset URLs need the repo name as a base path in production; the local
  // dev server keeps serving from "/" either way.
  base: process.env.GITHUB_PAGES ? '/xendra/' : '/',
  plugins: [react()],
  build: {
    // Phaser accounts for most of this; splitting it into its own lazy chunk
    // is a good follow-up (see README limitations) but out of scope here.
    chunkSizeWarningLimit: 1800,
  },
})
