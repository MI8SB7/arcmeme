import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress INVALID_ANNOTATION warnings from node_modules (known ox/rolldown incompatibility)
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          warning.id?.includes('node_modules')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
})

