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
                importScripts: ['firebase-messaging-sw.js'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            },
                        }
                    },
                    {
                        // Cache-First for static icons/images
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                            },
                        },
                    },
                    {
                        // Stale-While-Revalidate for Supabase Data
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'supabase-data-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 // 24 Hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // Stale-While-Revalidate for other same-origin resources
                        // @ts-expect-error self is defined in SW context
                        urlPattern: ({ url }) => url.origin === self.location.origin,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'static-resources',
                            /* formulas removed as it is not a valid property for StaleWhileRevalidate options */
                        },
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    // Removed manualChunks causing build failure
})
