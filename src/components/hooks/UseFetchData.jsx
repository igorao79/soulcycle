import { useState, useEffect, useRef, useCallback } from 'react';

// Глобальный объект для кэширования данных в памяти
const memoryCache = {};

// Время жизни кэша в миллисекундах (10 минут)
const CACHE_TTL = 10 * 60 * 1000;
// Минимальный интервал между запросами (2 секунды)
const MIN_REQUEST_INTERVAL = 2000;
// Для отслеживания времени последнего запроса
const lastRequestTime = {};

// Определяем, запущено ли приложение на GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Извлекаем информацию из Gist URL
const parseGistUrl = (url) => {
  if (url.startsWith('/gist/')) {
    const parts = url.split('/');
    return {
      username: parts[2],
      gistId: parts[3],
      filename: parts[parts.length - 1]
    };
  }
  return null;
};

// Получаем настоящий URL для GitHub Gist в обход CORS
const getGistUrl = (url) => {
  // Если это локальный запрос к Gist через прокси
  if (url.startsWith('/gist/')) {
    // Если мы на продакшене (GitHub Pages), используем альтернативный подход
    if (isGitHubPages) {
      // Извлекаем идентификаторы из URL
      const gistInfo = parseGistUrl(url);
      
      // Используем GitHub API для получения контента Gist
      // Этот API поддерживает CORS и не требует прокси
      return `https://api.github.com/gists/${gistInfo.gistId}`;
    }
  }
  
  // Для других URL или в режиме разработки возвращаем как есть
  return url;
};

// Функция для работы с localStorage, с обработкой ошибок
const localStorageHelper = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  }
};

// Обработка ответа от GitHub API для извлечения содержимого нужного файла
const processGistResponse = (gistData, originalUrl) => {
  try {
    const gistInfo = parseGistUrl(originalUrl);
    if (!gistInfo || !gistData.files) {
      return null;
    }
    
    // Ищем нужный файл в ответе Gist API
    const targetFilename = gistInfo.filename;
    
    // Перебираем все файлы и ищем тот, что нам нужен
    for (const filename in gistData.files) {
      if (filename === targetFilename || filename.endsWith(`/${targetFilename}`)) {
        // Если содержимое файла представлено в виде строки, пытаемся распарсить JSON
        const content = gistData.files[filename].content;
        if (content) {
          return JSON.parse(content);
        }
      }
    }
    
    // Если конкретный файл не найден, но есть какой-то файл JSON, используем его
    for (const filename in gistData.files) {
      if (filename.endsWith('.json')) {
        const content = gistData.files[filename].content;
        if (content) {
          return JSON.parse(content);
        }
      }
    }
    
    // Если ничего не нашли, возвращаем все данные Gist
    return gistData;
  } catch (error) {
    console.error('Error processing Gist response:', error);
    return null;
  }
};

// Функция для предварительной загрузки данных с защитой от слишком частых запросов
const preloadData = async (url, skipCache = false) => {
  // Создаем ключ для кэширования, удаляя параметр времени из URL
  const cacheKey = `data_${url.split('?v=')[0]}`;
  const isGistUrl = url.startsWith('/gist/');
  
  // Проверяем кэш в localStorage, если не нужно пропускать кэш
  if (!skipCache) {
    // Проверяем сначала в памяти
    if (memoryCache[cacheKey]) {
      return memoryCache[cacheKey].data;
    }
    
    // Проверяем в localStorage
    const cachedData = localStorageHelper.get(cacheKey);
    if (cachedData && cachedData.timestamp) {
      const now = Date.now();
      if (now - cachedData.timestamp < CACHE_TTL) {
        // Если кэш не устарел, используем его и сохраняем в памяти для быстрого доступа
        console.log('Using localStorage cached data');
        memoryCache[cacheKey] = cachedData;
        return cachedData.data;
      } else {
        console.log('Cache expired, fetching new data');
      }
    }
  }

  // Проверяем, не слишком ли часто делаем запросы к одному и тому же URL
  const now = Date.now();
  if (lastRequestTime[url] && now - lastRequestTime[url] < MIN_REQUEST_INTERVAL) {
    console.log('Throttling requests to avoid rate limiting');
    // Если запрос был недавно, возвращаем кэшированные данные из любого доступного источника
    if (memoryCache[cacheKey]) {
      return memoryCache[cacheKey].data;
    }
    const cachedData = localStorageHelper.get(cacheKey);
    return cachedData ? cachedData.data : null;
  }

  // Обновляем время последнего запроса
  lastRequestTime[url] = now;

  try {
    // Получаем правильный URL с учетом среды выполнения
    const fetchUrl = getGistUrl(url);
    const originalUrl = url; // Сохраняем оригинальный URL для обработки ответа Gist API
    console.log(`Fetching data from: ${fetchUrl}`);
    
    const response = await fetch(fetchUrl, {
      cache: skipCache ? 'no-cache' : 'default'
    });
    
    // Обрабатываем ошибку превышения лимита запросов
    if (response.status === 429) {
      console.warn('Rate limit exceeded, using cached data if available');
      // Используем кэш из любого доступного источника
      if (memoryCache[cacheKey]) {
        return memoryCache[cacheKey].data;
      }
      const cachedData = localStorageHelper.get(cacheKey);
      return cachedData ? cachedData.data : null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const json = await response.json();
    
    // Если это ответ от GitHub API, извлекаем нужный файл
    let processedData = json;
    if (isGistUrl && isGitHubPages) {
      processedData = processGistResponse(json, originalUrl);
    }
    
    // Сохраняем в оба кэша
    const cacheEntry = { 
      data: processedData, 
      timestamp: Date.now() 
    };
    memoryCache[cacheKey] = cacheEntry;
    localStorageHelper.set(cacheKey, cacheEntry);
    
    return processedData;
  } catch (err) {
    console.error('Preload error:', err);
    
    // В случае ошибки возвращаем кэшированные данные, если они есть
    if (memoryCache[cacheKey]) {
      return memoryCache[cacheKey].data;
    }
    const cachedData = localStorageHelper.get(cacheKey);
    return cachedData ? cachedData.data : null;
  }
};

export function useFetchData(url, options = {}) {
  const { skipCache = false, retryInterval = 10000 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true); // Флаг для проверки монтирования компонента
  const retryTimeoutRef = useRef(null);

  // Получаем базовый URL для кэширования
  const baseUrl = url.split('?v=')[0];
  const cacheKey = `data_${baseUrl}`;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setLoading(true);
    }
    
    try {
      // Пытаемся сначала использовать данные из localStorage при первом рендере
      // Это позволит мгновенно отобразить контент при перезагрузке страницы
      if (!forceRefresh && !data) {
        const cachedData = localStorageHelper.get(cacheKey);
        if (cachedData && cachedData.data && Date.now() - cachedData.timestamp < CACHE_TTL) {
          setData(cachedData.data);
          setError(null);
          setLoading(false);
          // Продолжаем выполнение функции, чтобы в фоне проверить обновления
        }
      }
      
      // Используем базовый URL для кэширования, но полный URL для запроса
      const json = await preloadData(url, forceRefresh || skipCache);
      
      if (!isMounted.current) return;

      if (json) {
        setData(json);
        setError(null);
        
        // Очищаем таймер повторных попыток при успехе
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } else {
        // Если API не вернул данные и нет кэша, устанавливаем ошибку
        const cachedData = localStorageHelper.get(cacheKey);
        if (!cachedData || !cachedData.data) {
          throw new Error('Failed to load data');
        }
      }
    } catch (err) {
      if (isMounted.current) {
        // Устанавливаем ошибку, но продолжаем использовать предыдущие данные, если они есть
        setError(err.message);
        console.error('Fetch error:', err);
        
        // Пробуем повторить запрос через указанный интервал
        if (isMounted.current && !retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              console.log('Retrying fetch...');
              retryTimeoutRef.current = null;
              fetchData(true);
            }
          }, retryInterval);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [url, baseUrl, cacheKey, skipCache, retryInterval, data]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Отмена обновления состояния и очистка таймеров при размонтировании
    return () => {
      isMounted.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchData]);

  // Добавляем функцию для принудительной очистки кэша
  const clearCache = useCallback(() => {
    const cacheKey = `data_${baseUrl}`;
    delete memoryCache[cacheKey];
    localStorageHelper.remove(cacheKey);
    fetchData(true);
  }, [baseUrl, fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refresh: () => fetchData(true),
    clearCache
  };
}
