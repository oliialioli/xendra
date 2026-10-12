import react from '@vitejs/plugin-react'
import { createServer, defineConfig, type Plugin, type ViteDevServer } from 'vite'

/**
 * Fills index.html's two SEO placeholders -- the schema.org structured data
 * and the plain-HTML summary under the loading screen -- from the site's own
 * content (src/seo/siteSeo.ts). That module is app code (it imports the
 * content files), so it's loaded through Vite itself rather than imported
 * here: the dev server when there is one, a throwaway one during a build.
 */
function seoHtml(): Plugin {
  let devServer: ViteDevServer | null = null
  async function loadSeo() {
    const server =
      devServer ??
      (await createServer({
        configFile: false,
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true },
      }))
    try {
      return await server.ssrLoadModule('/src/seo/siteSeo.ts')
    } finally {
      if (!devServer) await server.close()
    }
  }
  return {
    name: 'xendra-seo',
    configureServer(server) {
      devServer = server
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        const seo = await loadSeo()
        return html
          .replace('<!--seo:jsonld-->', `<script type="application/ld+json">${seo.seoJsonLd()}</script>`)
          .replace('<!--seo:summary-->', seo.staticSummaryHtml())
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of its own domain (https://xendra.eus, set as
  // GitHub Pages' custom domain -- see public/CNAME), so no base path: the
  // repo-name prefix (/xendra/) is only needed on <user>.github.io/<repo>.
  base: '/',
  plugins: [react(), seoHtml()],
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
