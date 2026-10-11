import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of its own domain (https://xendra.eus, set as
  // GitHub Pages' custom domain -- see public/CNAME), so no base path: the
  // repo-name prefix (/xendra/) is only needed on <user>.github.io/<repo>.
  base: '/',
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
