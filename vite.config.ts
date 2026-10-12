import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { createServer, defineConfig, type Plugin, type ViteDevServer } from 'vite'

/**
 * Publishes every address of the site -- the map and each section -- as its
 * own HTML page running the same app, each with its own title, description,
 * structured data and plain-HTML summary (src/seo/siteSeo.ts), so it can be
 * found and linked to on its own. index.html carries two placeholders for
 * them:
 *
 *  - dev: filled per request, for whichever address is being opened;
 *  - build: left in place, then one copy of the built page is written per
 *    address (dist/musika/index.html...), plus 404.html (the app, which says
 *    the address is unknown) and sitemap.xml.
 *
 * siteSeo.ts is app code (it imports the content files), so it's loaded
 * through Vite itself rather than imported here: the dev server when there
 * is one, a throwaway one during a build.
 */
function seoHtml(): Plugin {
  let devServer: ViteDevServer | null = null
  let outDir = 'dist'
  let isBuild = false
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
  const fill = (html: string, head: string, summary: string) =>
    html.replace('<!--seo:head-->', head).replace('<!--seo:summary-->', summary)
  return {
    name: 'xendra-seo',
    configResolved(config) {
      isBuild = config.command === 'build'
      outDir = resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      devServer = server
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        if (isBuild) return html
        const seo = await loadSeo()
        const page = seo.seoPageForUrl(ctx.originalUrl ?? '/')
        return fill(html, seo.headHtml(page), page.summaryHtml)
      },
    },
    async closeBundle() {
      if (!isBuild) return
      const seo = await loadSeo()
      const template = readFileSync(join(outDir, 'index.html'), 'utf8')
      for (const page of seo.seoPages()) {
        const file = page.path === '/' ? join(outDir, 'index.html') : join(outDir, page.path, 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, fill(template, seo.headHtml(page), page.summaryHtml))
      }
      const notFound = seo.notFoundPage()
      writeFileSync(join(outDir, '404.html'), fill(template, seo.headHtml(notFound, undefined, { noindex: true }), notFound.summaryHtml))
      writeFileSync(join(outDir, 'sitemap.xml'), seo.sitemapXml())
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
