import { auth } from './config';
import { onAuthStateChanged } from 'firebase/auth';
import { usersApi } from '../services/api';

// Функция для синхронизации пользователя с API
export const syncUserToFirestore = async (user) => {
  if (!user) return;

  try {
    await usersApi.syncUser();
  } catch (error) {
    console.error('Error syncing user to API:', error);
  }
};

// Инициализация синхронизации
export const initUserSync = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      syncUserToFirestore(user);
    }
  });
}; 