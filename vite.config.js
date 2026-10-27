import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:5500',
        ws: true
      }
    }
  }
});
