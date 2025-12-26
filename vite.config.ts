import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            includeAssets: ['favicon.ico', 'apple-touch-icon.svg', 'favicon.svg', 'favicon-96x96.svg', 'favicon-158x158.svg'],
            manifest: {
                name: 'Sarathi Book',
                short_name: 'Sarathi',
                description: 'Your Digital Office on Car',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'logo.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
})
