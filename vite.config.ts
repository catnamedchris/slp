import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const isPortalPreview = process.env.AMP_PORTAL_PREVIEW === '1';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  plugins: [
    react(),
    VitePWA({
      disable: isPortalPreview,
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'DAYC-2 Score Calculator',
        short_name: 'DAYC-2',
        description: 'Developmental Assessment of Young Children, Second Edition - Score Calculator',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,pdf}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MB to accommodate DAYC2-Scoring-Manual.pdf
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    {
      name: 'optimize-portal-html',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler: (html, context) => {
          if (!isPortalPreview || !context.bundle) return html;

          for (const [fileName, output] of Object.entries(context.bundle)) {
            if (output.type === 'chunk' && output.isEntry) {
              const scriptTag = `<script type="module" crossorigin src="/${fileName}"></script>`;
              const code = output.code.replace(/<\/script/gi, '<\\/script');
              html = html.replace(scriptTag, () => `<script type="module">${code}</script>`);
            } else if (output.type === 'asset' && fileName.endsWith('.css')) {
              const styleTag = `<link rel="stylesheet" crossorigin href="/${fileName}">`;
              const css = String(output.source).replace(/<\/style/gi, '<\\/style');
              html = html.replace(styleTag, () => `<style>${css}</style>`);
            }
          }

          return html.replace(
            /\s*<link[^>]+href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/g,
            '',
          );
        },
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './data'),
    },
  },
  server: {
    allowedHosts: process.env.AMP_ORB ? true : undefined,
  },
  build: {
    outDir: 'dist-web',
    chunkSizeWarningLimit: 800,
  },
  base: process.env.GITHUB_ACTIONS ? '/slp/' : '/',
});
