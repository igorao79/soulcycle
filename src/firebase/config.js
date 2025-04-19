import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Определяем, является ли сайт GitHub Pages
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');

const firebaseConfig = {
  // Используем переменные окружения для конфиденциальных данных
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let analytics = null;

// Инициализируем Analytics только если он поддерживается
try {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } else {
      console.log('Firebase Analytics is not supported in this environment');
    }
  });
} catch (error) {
  console.error('Failed to initialize Analytics:', error);
}

const db = getFirestore(app);
const storage = getStorage(app);

// Настройка CORS для Firebase Storage
// Примечание: для полного решения CORS необходимо также настроить правила в консоли Firebase
// и добавить соответствующие заголовки на сервере

// Настройка специальных опций для Firestore при работе с GitHub Pages
if (IS_GITHUB_PAGES) {
  console.log('Running on GitHub Pages, applying special Firestore settings');
  // Используем эти опции для уменьшения сетевых запросов и уменьшения вероятности CORS-ошибок
  try {
    db._settings = {
      ignoreUndefinedProperties: true,
      cacheSizeBytes: 40000000, // Увеличить кэш до 40MB
      experimentalForceLongPolling: true, // Использовать long polling вместо WebSockets
      experimentalAutoDetectLongPolling: true,
    };
    console.log('Applied special Firestore settings for GitHub Pages');
  } catch (error) {
    console.error('Failed to apply special Firestore settings:', error);
  }
}

export { auth, analytics, db, storage }; 