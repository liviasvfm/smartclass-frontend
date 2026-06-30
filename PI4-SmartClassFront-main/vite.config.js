import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'SmartClass — Controle de Chaves',
        short_name: 'SmartClass',
        description: 'Sistema de controle inteligente de acesso a salas e chaves do SENAC.',
        theme_color: '#004a8d',
        background_color: '#f3f4f6',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/login',
        lang: 'pt-BR',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Arquivos estáticos em cache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Estratégia NetworkFirst para chamadas de API (sempre tenta rede primeiro)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/smartclass-backend-production\.up\.railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'smartclass-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
