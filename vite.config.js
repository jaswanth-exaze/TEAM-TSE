import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repositoryRoot = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(repositoryRoot, 'apps/web')

export default defineConfig({
  root: webRoot,
  // Keep the same app working at the project root and under GitHub Pages' repository path.
  base: './',
  // Static site assets and standalone labs are copied by scripts/copy-site.mjs.
  publicDir: false,
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: resolve(repositoryRoot, 'dist'),
    emptyOutDir: true,
    assetsDir: 'courses/assets',
    rollupOptions: {
      input: {
        courses: resolve(webRoot, 'courses/index.html'),
      },
    },
  },
})
