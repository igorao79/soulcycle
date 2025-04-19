import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';

const useUserData = (userId) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Создаем абортконтроллер для возможности отмены запроса при размонтировании
    const controller = new AbortController();
    
    const fetchUserData = async () => {
      try {
        const data = await usersApi.getUser(userId);
        setUserData(data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching user data:', err);
          setError(err.message);
          setUserData(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Отмена запроса при размонтировании компонента
    return () => controller.abort();
  }, [userId]);

  return { userData, loading, error };
};

export default useUserData; 