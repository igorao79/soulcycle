import { auth } from '../firebase/config';
import firebase from 'firebase/app';

// Базовый URL для внешнего API
const API_URL = "https://scapi-dj82ynavq-igors-projects-f86e1b8f.vercel.app";

// Функция для получения токена авторизации
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Пользователь не авторизован');
  }
  return user.getIdToken();
};

// Базовая функция для выполнения запросов с авторизацией
const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ошибка запроса: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API ошибка:', error);
    throw error;
  }
};

// Функция для выполнения запросов без авторизации
const fetchWithoutAuth = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ошибка запроса: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API ошибка:', error);
    throw error;
  }
};

// Функция для выполнения запросов с авторизацией, если пользователь авторизован
const fetchWithOptionalAuth = async (endpoint, options = {}) => {
  try {
    let headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Добавляем токен, если пользователь авторизован
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ошибка запроса: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API ошибка:', error);
    throw error;
  }
};

// API для работы с постами
export const postsApi = {
  // Получить все посты
  getPosts: () => fetchWithoutAuth('/api/posts'),
  
  // Создать новый пост
  createPost: (postData) => fetchWithAuth('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  }),
  
  // Удалить пост
  deletePost: (postId) => fetchWithAuth(`/api/posts/${postId}`, {
    method: 'DELETE'
  })
};

// API для работы с лайками
export const likesApi = {
  // Поставить лайк на пост
  likePost: (postId) => fetchWithAuth(`/api/posts/${postId}/like`, {
    method: 'POST'
  }),
  
  // Снять лайк с поста
  unlikePost: (postId) => fetchWithAuth(`/api/posts/${postId}/like`, {
    method: 'DELETE'
  }),
  
  // Проверить, лайкнул ли текущий пользователь пост
  checkLiked: (postId) => fetchWithAuth(`/api/posts/${postId}/liked`),
  
  // Получить всех пользователей, лайкнувших пост
  getPostLikers: (postId, limit = 10, offset = 0) => 
    fetchWithoutAuth(`/api/posts/${postId}/likers?limit=${limit}&offset=${offset}`)
};

// API для работы с комментариями
export const commentsApi = {
  // Получить комментарии для поста
  getComments: (postId) => fetchWithoutAuth(`/api/posts/${postId}/comments`),
  
  // Создать комментарий
  createComment: (postId, content) => fetchWithAuth(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  
  // Удалить комментарий
  deleteComment: (postId, commentId) => fetchWithAuth(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE'
  })
};

// API для работы с пользователями
export const usersApi = {
  // Получить данные пользователя
  getUser: (userId) => fetchWithoutAuth(`/api/users/${userId}`),
  
  // Получить текущего пользователя
  getMe: () => fetchWithAuth('/api/users/me'),
  
  // Синхронизировать данные пользователя после входа
  syncUser: (userData) => fetchWithAuth('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  // Поиск пользователей
  searchUsers: (query) => fetchWithoutAuth(`/api/users?q=${encodeURIComponent(query)}`)
};

// API для работы с опросами
export const pollsApi = {
  // Голосовать в опросе
  vote: (postId, optionId) => fetchWithAuth(`/api/posts/${postId}/poll/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId })
  }),
  
  // Получить результаты опроса
  getResults: (postId) => fetchWithOptionalAuth(`/api/posts/${postId}/poll/votes`),
  
  // Получить мой голос в опросе
  getMyVote: (postId) => fetchWithAuth(`/api/posts/${postId}/poll/my-vote`)
};

// API для работы с уведомлениями
export const notificationsApi = {
  // Получить все уведомления
  getNotifications: () => fetchWithAuth('/api/notifications'),
  
  // Отметить уведомление как прочитанное
  markAsRead: (notificationId) => fetchWithAuth(`/api/notifications/${notificationId}/read`, {
    method: 'POST'
  }),
  
  // Отметить все уведомления как прочитанные
  markAllAsRead: () => fetchWithAuth('/api/notifications/read', {
    method: 'POST'
  }),
  
  // Удалить уведомление
  deleteNotification: (notificationId) => fetchWithAuth(`/api/notifications/${notificationId}`, {
    method: 'DELETE'
  }),
  
  // Удалить все уведомления
  deleteAllNotifications: () => fetchWithAuth('/api/notifications/clear', {
    method: 'DELETE'
  })
};

export default {
  postsApi,
  likesApi,
  commentsApi,
  usersApi,
  pollsApi,
  notificationsApi
}; 