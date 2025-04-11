import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

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
    
    // Подписываемся на изменения документа пользователя
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          setUserData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user data:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, [userId]);

  return { userData, loading, error };
};

export default useUserData; 