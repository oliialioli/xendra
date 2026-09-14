import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Phaser accounts for most of this; splitting it into its own lazy chunk
    // is a good follow-up (see README limitations) but out of scope here.
    chunkSizeWarningLimit: 1800,
  },
})
