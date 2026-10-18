import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'styled-components'],
        },
      },
    },
  },
  // Убираем console.* и debugger из продакшен-сборки
  esbuild: process.env.NODE_ENV === 'production' ? { drop: ['console', 'debugger'] } : {},
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Данные персонажей из Gist (в проде то же делает rewrite в vercel.json)
      '/gist': {
        target: 'https://gist.githubusercontent.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gist/, ''),
      },
      '/api/cloudinary': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
