import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';

const useUserRole = (userId) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        setLoading(true);
        const userData = await usersApi.getUser(userId);
        setIsAdmin(userData?.isAdmin === true);
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  return { isAdmin, loading };
};

export default useUserRole; 