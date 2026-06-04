import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

// Repo-naam = pad waarop GitHub Pages de project-site serveert.
const REPO = 'PienterToolV2'

// Na de build index.html dupliceren naar 404.html (SPA-fallback voor
// history-mode deep links) + .nojekyll zodat Pages /assets niet filtert.
function pagesFallback(): Plugin {
  return {
    name: 'pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(dist, '404.html'))
      }
      fs.writeFileSync(path.join(dist, '.nojekyll'), '')
    },
  }
}

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'
  return {
    base: isDemo ? `/${REPO}/` : '/',
    plugins: [vue(), ...(isDemo ? [pagesFallback()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/uploads': {
          target: 'http://localhost:3210',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:3210',
          changeOrigin: true,
        },
      },
    },
  }
})
