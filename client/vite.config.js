import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the Express backend so the browser talks to one
      // origin (no CORS) and streaming responses pass straight through.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // The Stockfish worker lives in public/ and is loaded by URL, so it does not
  // go through the bundler. Nothing special needed here for it.
});
