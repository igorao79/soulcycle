import { auth, db } from './config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Функция для создания/обновления записи пользователя в Firestore
export const syncUserToFirestore = async (user) => {
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Создаем новую запись пользователя
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
        isAdmin: false,
        isEarlyUser: false,
        lastLogin: new Date().toISOString()
      });
    } else {
      // Обновляем время последнего входа
      await setDoc(userRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
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