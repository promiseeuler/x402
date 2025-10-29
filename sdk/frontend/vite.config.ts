import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    minify: 'terser'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3004,
    open: true
  },
  define: {
    global: 'globalThis',
    // Expose environment variables to the client
    'process.env.REACT_APP_FACILITATOR_URL': JSON.stringify(process.env.REACT_APP_FACILITATOR_URL),
    'process.env.REACT_APP_FACILITATOR_FEE': JSON.stringify(process.env.REACT_APP_FACILITATOR_FEE),
    'process.env.REACT_APP_PRICE_CLAUDE_HAIKU': JSON.stringify(process.env.REACT_APP_PRICE_CLAUDE_HAIKU),
    'process.env.REACT_APP_PRICE_CLAUDE_SONNET': JSON.stringify(process.env.REACT_APP_PRICE_CLAUDE_SONNET),
    'process.env.REACT_APP_PRICE_GPT35': JSON.stringify(process.env.REACT_APP_PRICE_GPT35),
    'process.env.REACT_APP_PRICE_GPT4': JSON.stringify(process.env.REACT_APP_PRICE_GPT4),
    'process.env.REACT_APP_DEFAULT_NETWORK': JSON.stringify(process.env.REACT_APP_DEFAULT_NETWORK),
    'process.env.REACT_APP_SPENDING_LIMIT_DAILY': JSON.stringify(process.env.REACT_APP_SPENDING_LIMIT_DAILY),
    'process.env.REACT_APP_SPENDING_LIMIT_PER_TRANSACTION': JSON.stringify(process.env.REACT_APP_SPENDING_LIMIT_PER_TRANSACTION)
  }
});