import { useState, useEffect, useRef } from 'react';

// Глобальный объект для кэширования данных
const cache = {};

export function useFetchData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true); // Флаг для проверки монтирования компонента

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      if (cache[url]) {
        // Если данные уже есть в кэше — используем их
        setData(cache[url]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load data');
        const json = await response.json();

        // Сохраняем данные в кэш
        cache[url] = json;

        if (isMounted.current) setData(json);
      } catch (err) {
        if (isMounted.current) setError(err.message);
        console.error('Fetch error:', err); // Логирование ошибки
      } finally {
        if (isMounted.current) setLoading(false);
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
