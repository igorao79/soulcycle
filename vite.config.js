import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { exec } from 'child_process';
import viteImagemin from 'vite-plugin-imagemin';
import viteCompression from 'vite-plugin-compression';
import { splitVendorChunkPlugin } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { VitePWA } from 'vite-plugin-pwa';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// Determine the base path based on environment
const baseConfig = process.env.NODE_ENV === 'production' 
  ? '/soulcycle/' 
  : '/';

export default defineConfig({
  plugins: [
    react(),
    // Плагин для разделения кода вендоров
    splitVendorChunkPlugin(),
    // Оптимизация изображений
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.7, 0.8],
        speed: 4,
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
      webp: {
        quality: 80,
      }
    }),
    // Дополнительное сжатие (gzip)
    compression({
      algorithm: 'gzip', 
      threshold: 10240,
      ext: '.gz'
    }),
    // Дополнительное сжатие (brotli)
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 10240, 
      ext: '.br'
    }),
    // Поддержка старых браузеров
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    // Опциональная поддержка PWA
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'SoulCycle App',
        short_name: 'SoulCycle',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
    // CSS оптимизация - внедрение CSS в JS для снижения запросов
    cssInjectedByJsPlugin(),
    // Плагин для анализа размера бандла (только для production)
    process.env.ANALYZE && visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: true, // Автоматически открывать отчет после сборки
    }),
    // Генерация env.js файла перед сборкой
    {
      name: 'generate-env-config',
      buildStart() {
        if (process.env.NODE_ENV === 'production') {
          exec('node scripts/generate-env-config.js', (error, stdout, stderr) => {
            if (error) {
              console.error(`Ошибка генерации env.js: ${error}`);
              return;
            }
            console.log(stdout);
          });
        }
      }
    }
  ],
  base: baseConfig,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: process.env.NODE_ENV !== 'production', // Исходники только в dev режиме
    cssCodeSplit: true, // Разделение CSS по чанкам
    reportCompressedSize: false, // Для ускорения сборки
    chunkSizeWarningLimit: 1000, // Предупреждение о больших чанках
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : []
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false // Удаляем комментарии
      }
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/chunks/[name].[hash].js',
        entryFileNames: 'assets/entry/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name].[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },
        manualChunks: (id) => {
          // Разбиваем зависимости на специальные чанки для оптимизации кеширования
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animations';
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor'; // Остальные зависимости
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: true,
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    }
  },
  // Предзагрузка (preload) модулей
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['path'],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  // Настройки esbuild для более быстрой сборки
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});