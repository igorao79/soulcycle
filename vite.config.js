import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  base: '/soulcycle/', // Укажите имя вашего репозитория

  server: {
    open: true, // Автоматически открывает браузер
  }
});
