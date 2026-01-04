import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt', // Changed from 'autoUpdate' to 'prompt' to enable UpdateWatcher UI
            injectRegister: 'script',
            includeAssets: ['apple-touch-icon.png', 'favicon.png', 'favicon-96x96.png', 'favicon-158x158.png', 'logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
            manifest: {
                name: 'Sarathi Book',
                short_name: 'Sarathi',
                description: 'Your Digital Office on Car',
                theme_color: '#0047AB',
                background_color: '#F5F7FA',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: false, // Wait for user confirmation
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                importScripts: ['firebase-messaging-sw.js']
            },
            devOptions: {
                enabled: true
            }
        })
    ],
})
