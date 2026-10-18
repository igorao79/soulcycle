/**
 * Файл с конфигурацией переменных окружения
 * Значения берутся из переменных окружения Vite (VITE_*), которые Vercel подставляет при сборке
 */

// Функция для безопасного получения переменных окружения
const getEnvVar = (key, defaultValue = '') => {
  // Префикс для Vite переменных окружения
  const viteKey = `VITE_${key}`;
  
  return import.meta.env[viteKey] || defaultValue;
};

// Настройки Supabase
export const SUPABASE_URL = getEnvVar(
  'SUPABASE_URL', 
  'https://euafjzczdtitceulztfw.supabase.co'
);

export const SUPABASE_ANON_KEY = getEnvVar(
  'SUPABASE_ANON_KEY', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1YWZqemN6ZHRpdGNldWx6dGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY0MTcsImV4cCI6MjA2MTc4MjQxN30.i5duBK9a2QKWbc2Y_v723APJeg0vsNNwNkgXZLyIMfM'
);

// Название приложения
export const APP_NAME = getEnvVar('APP_NAME', 'SoulCycle');

// Режим приложения
export const IS_PRODUCTION = import.meta.env.PROD === true;

// Функция для логирования - в production отключена
export const logDebug = (...args) => {
  if (!IS_PRODUCTION) {
    console.log(...args);
  }
}; 