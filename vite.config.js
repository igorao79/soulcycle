import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true, // Автоматически открывает диаграмму после сборки
      gzipSize: true, // Показывает размер в gzip
      brotliSize: true, // Показывает размер в brotli
    }),
    viteCompression({
      algorithm: 'brotli', // Сжатие brotli
      ext: '.br', // Расширение для сжатых файлов
      deleteOriginFile: false, // Не удалять исходные файлы
      verbose: true, // Логи для отладки
      threshold: 10240, // Сжимать только файлы >10kb
      compressionOptions: {
        level: 11, // Максимальный уровень сжатия для Brotli (от 0 до 11)
      },
    }),
  ],

  base: '', // Убираем базовый путь

  server: {
    open: true,
    host: 'localhost',
    port: 5173,
    strictPort: true, // Не пытаться использовать другой порт, если 5173 занят
    hmr: {
      overlay: false, // Отключаем наложение ошибок HMR (менее навязчиво)
    },
    headers: {
      'Cache-Control': 'no-cache, must-revalidate', // Изменено на более мягкое кэширование
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'], // Игнорируем лишние файлы для ускорения Hot Module Replacement
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: 'terser', // Минификация с помощью Terser
    terserOptions: {
      compress: {
        drop_console: true, // Убираем console.log для продакшн
        unused: true, // Удаляем неиспользуемые переменные
        dead_code: true, // Убираем мертвый код
        ecma: 2020, // Современный стандарт JavaScript для минификации
        passes: 2, // Дополнительные проходы для лучшей минификации
      },
      mangle: {
        properties: {
          regex: /^_/, // Переименовываем приватные свойства, начинающиеся с "_"
        },
      },
      format: {
        comments: false, // Убираем комментарии
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.woff') || assetInfo.name.endsWith('.woff2')) {
            return 'assets/fonts/[name].[hash].[ext]'; // Сохраняем шрифты с хэшем
          }
          return 'assets/[name].[hash].[ext]'; // Добавляем хэш для кэширования
        },
        chunkFileNames: 'assets/chunks/[name].[hash].js', // Разделяем чанки с хэшем
        entryFileNames: 'assets/entry/[name].[hash].js', // Основной файл с хэшем
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor'; // Группируем все зависимости в один файл vendor.js
          }
        },
      },
    },
    assetsInlineLimit: 8192, // Встраиваем маленькие файлы (например, SVG) как Base64
    cssCodeSplit: true, // Разделяем CSS для каждого компонента
    sourcemap: false, // Отключаем source maps для продакшн
  },
});