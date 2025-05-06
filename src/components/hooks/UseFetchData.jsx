import { useState, useEffect, useRef } from 'react';

// Глобальный объект для кэширования данных
const cache = {};

// Функция для предварительной загрузки данных
const preloadData = async (url) => {
  if (cache[url]) {
    return cache[url];
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    cache[url] = json;
    return json;
  } catch (err) {
    console.error('Preload error:', err);
    return null;
  }
};

export function useFetchData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true); // Флаг для проверки монтирования компонента

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      try {
        const json = await preloadData(url);
        
        if (!isMounted.current) return;

        if (!json) {
          throw new Error('Failed to load data');
        }

        setData(json);
        setError(null);
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
          console.error('Fetch error:', err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Отмена обновления состояния при размонтировании
    return () => {
      isMounted.current = false;
    };
  }, [url]);

  return { data, loading, error };
}
