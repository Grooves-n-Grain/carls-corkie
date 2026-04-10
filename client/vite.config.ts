import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: '../',
  plugins: [react()],
  server: {
    port: 5180,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
