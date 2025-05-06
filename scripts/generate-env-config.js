/**
 * Скрипт для генерации конфигурации env.js при деплое
 * Этот скрипт генерирует файл public/env.js, который будет 
 * доступен в браузере и содержать переменные окружения
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем директорию public, если она не существует
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Получаем переменные окружения для внешнего доступа
const env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_APP_NAME: process.env.VITE_APP_NAME || 'SoulCycle',
};

// Создаем содержимое файла env.js
const content = `
window.env = ${JSON.stringify(env, null, 2)};
`;

// Записываем файл
fs.writeFileSync(
  path.resolve(publicDir, 'env.js'), 
  content
);

console.log('✅ Конфигурация env.js сгенерирована успешно!'); 