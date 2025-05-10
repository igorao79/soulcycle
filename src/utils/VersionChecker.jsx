import { useEffect } from 'react';

// Ключ для хранения версии в localStorage
const VERSION_KEY = 'app_version';

// Функция для получения базового URL сайта (с учетом GitHub Pages)
const getBaseUrl = () => {
  // Определяем, на GitHub Pages мы или локально
  const isGitHubPages = window.location.hostname.includes('github.io');
  // Получаем базовый URL из package.json homepage или из текущего пути
  const repoName = isGitHubPages ? '/soulcycle' : '';
  return `${window.location.protocol}//${window.location.host}${repoName}`;
};

// Функция для очистки кэша приложения
const clearAppCache = () => {
  console.log('Обнаружена новая версия приложения. Очищаем кэш...');
  
  // Очищаем весь localStorage (или можно очищать только определенные ключи)
  const keysToPreserve = []; // Можно добавить ключи, которые не нужно удалять
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!keysToPreserve.includes(key)) {
      localStorage.removeItem(key);
    }
  }

  // Пытаемся очистить кэш браузера, если поддерживается API Cache
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }

  // Можно также обновить страницу для применения изменений
  window.location.reload(true);
};

const VersionChecker = () => {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Получаем базовый URL для нашего сайта
        const baseUrl = getBaseUrl();
        // Добавляем случайный параметр, чтобы избежать кэширования запроса
        const response = await fetch(`${baseUrl}/version.json?_=${Date.now()}`);
        if (!response.ok) {
          console.error('Не удалось получить информацию о версии');
          return;
        }
        
        const data = await response.json();
        const currentVersion = data.version;
        const currentTimestamp = data.buildTimestamp;
        
        // Получаем сохраненную версию
        const savedVersion = localStorage.getItem(VERSION_KEY);
        
        if (!savedVersion) {
          // Если версия не сохранена, сохраняем текущую
          localStorage.setItem(VERSION_KEY, JSON.stringify({
            version: currentVersion,
            timestamp: currentTimestamp
          }));
        } else {
          // Сравниваем версии
          const savedData = JSON.parse(savedVersion);
          
          // Если версия или время сборки изменились, очищаем кэш
          if (savedData.version !== currentVersion || 
              savedData.timestamp !== currentTimestamp) {
            clearAppCache();
            
            // Обновляем сохраненную версию
            localStorage.setItem(VERSION_KEY, JSON.stringify({
              version: currentVersion,
              timestamp: currentTimestamp
            }));
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке версии:', error);
      }
    };
    
    // Проверяем версию при загрузке
    checkVersion();
    
  }, []);
  
  // Компонент не рендерит никакого UI
  return null;
};

export default VersionChecker; 