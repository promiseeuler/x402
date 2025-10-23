import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'public/index.html'
      }
    }
  },
  optimizeDeps: {
    include: ['thirdweb']
  },
  define: {
    global: 'globalThis'
  }
});