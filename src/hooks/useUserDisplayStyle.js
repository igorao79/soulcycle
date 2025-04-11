import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const useUserDisplayStyle = (userId) => {
  const [displayStyle, setDisplayStyle] = useState({
    className: '',
    style: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStyle = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const activePrivilege = userData.activePrivilege || 'nickname';

          // Определяем стили на основе активной привилегии
          switch (activePrivilege) {
            case 'admin':
              setDisplayStyle({
                className: 'admin-name',
                style: {
                  color: '#FFD700',
                  fontWeight: 600
                }
              });
              break;
            
            case 'early-user':
              setDisplayStyle({
                className: 'early-user-name',
                style: {
                  color: '#FF4444',
                  fontWeight: 500
                }
              });
              break;
            
            case 'custom-title':
              setDisplayStyle({
                className: 'custom-title-name',
                style: {
                  color: '#4A90E2',
                  fontWeight: 500
                }
              });
              break;
            
            default:
              setDisplayStyle({
                className: 'default-name',
                style: {
                  color: '#2c3e50',
                  fontWeight: 400
                }
              });
          }
        }
      } catch (err) {
        console.error('Error fetching user display style:', err);
        // В случае ошибки используем стандартный стиль
        setDisplayStyle({
          className: 'default-name',
          style: {
            color: '#2c3e50',
            fontWeight: 400
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserStyle();
    }
  }, [userId]);

  return { displayStyle, isLoading };
};

export default useUserDisplayStyle; 