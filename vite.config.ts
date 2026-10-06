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
    // Phaser alone is ~1.2 MB, so it gets a chunk of its own (warning raised to fit it).
    chunkSizeWarningLimit: 1400,
    rolldownOptions: {
      output: {
        // The libraries (Phaser above all) in their own files, apart from
        // the site's code: they rarely change, so a visitor's browser keeps
        // them cached across our updates and only re-downloads the app.
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /node_modules[\\/]phaser/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
})
