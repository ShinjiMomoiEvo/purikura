import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: ['emoji-mart', '@emoji-mart/data'],
    },
    ssr: {
        noExternal: ['emoji-mart', '@emoji-mart/data'],
    },
})
