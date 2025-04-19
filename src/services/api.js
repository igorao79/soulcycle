import { auth } from '../firebase/config';

// Базовый URL для внешнего API
const API_URL = import.meta.env.VITE_API_URL || "https://scapi-dj82ynavq-igors-projects-f86e1b8f.vercel.app";

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
    
    if (response.status === 204) {
      return null;
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
    
    if (response.status === 204) {
      return null;
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
    
    if (response.status === 204) {
      return null;
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
  getPosts: (options = {}) => {
    const { limit, offset, orderBy, userId } = options;
    let url = '/api/posts?';
    
    if (limit) url += `limit=${limit}&`;
    if (offset) url += `offset=${offset}&`;
    if (orderBy) url += `orderBy=${orderBy}&`;
    if (userId) url += `userId=${userId}&`;
    
    return fetchWithOptionalAuth(url);
  },
  
  // Получить конкретный пост
  getPost: (postId) => fetchWithOptionalAuth(`/api/posts/${postId}`),
  
  // Создать новый пост
  createPost: (postData) => fetchWithAuth('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  }),
  
  // Обновить пост
  updatePost: (postId, postData) => fetchWithAuth(`/api/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(postData)
  }),
  
  // Удалить пост
  deletePost: (postId) => fetchWithAuth(`/api/posts/${postId}`, {
    method: 'DELETE'
  }),
  
  // Поиск постов
  searchPosts: (query) => fetchWithOptionalAuth(`/api/posts/search?q=${encodeURIComponent(query)}`)
};

// API для работы с лайками
export const likesApi = {
  // Поставить лайк посту
  likePost: (postId) => fetchWithAuth(`/api/posts/${postId}/like`, {
    method: 'POST'
  }),
  
  // Убрать лайк с поста
  unlikePost: (postId) => fetchWithAuth(`/api/posts/${postId}/like`, {
    method: 'DELETE'
  }),
  
  // Проверить, лайкнул ли пользователь пост
  isPostLiked: (postId) => fetchWithAuth(`/api/posts/${postId}/liked`),
  
  // Получить список пользователей, лайкнувших пост
  getPostLikers: (postId, options = {}) => {
    const { limit, offset } = options;
    let url = `/api/posts/${postId}/likers?`;
    
    if (limit) url += `limit=${limit}&`;
    if (offset) url += `offset=${offset}&`;
    
    return fetchWithOptionalAuth(url);
  }
};

// API для работы с комментариями
export const commentsApi = {
  // Получить комментарии к посту
  getComments: (postId, options = {}) => {
    const { limit, offset, orderBy } = options;
    let url = `/api/posts/${postId}/comments?`;
    
    if (limit) url += `limit=${limit}&`;
    if (offset) url += `offset=${offset}&`;
    if (orderBy) url += `orderBy=${orderBy}&`;
    
    return fetchWithOptionalAuth(url);
  },
  
  // Создать комментарий
  createComment: (postId, content) => fetchWithAuth(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  
  // Обновить комментарий
  updateComment: (postId, commentId, content) => fetchWithAuth(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'PUT',
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
  getUser: (userId) => fetchWithOptionalAuth(`/api/users/${userId}`),
  
  // Получить текущего пользователя
  getMe: () => fetchWithAuth('/api/users/me'),
  
  // Обновить данные пользователя
  updateUser: (userData) => fetchWithAuth('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  // Синхронизировать данные пользователя после входа
  syncUser: () => fetchWithAuth('/api/users/sync', {
    method: 'POST'
  }),
  
  // Поиск пользователей
  searchUsers: (query) => fetchWithOptionalAuth(`/api/users/search?q=${encodeURIComponent(query)}`),
  
  // Проверить роль пользователя (admin)
  checkUserRole: () => fetchWithAuth('/api/users/role')
};

// API для работы с опросами
export const pollsApi = {
  // Голосовать в опросе
  vote: (postId, optionId) => fetchWithAuth(`/api/posts/${postId}/poll/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId })
  }),
  
  // Получить результаты опроса
  getResults: (postId) => fetchWithOptionalAuth(`/api/posts/${postId}/poll/results`),
  
  // Получить мой голос в опросе
  getMyVote: (postId) => fetchWithAuth(`/api/posts/${postId}/poll/my-vote`)
};

// API для работы с уведомлениями
export const notificationsApi = {
  // Получить уведомления пользователя
  getNotifications: (options = {}) => {
    const { limit, offset, unreadOnly } = options;
    let url = `/api/notifications?`;
    
    if (limit) url += `limit=${limit}&`;
    if (offset) url += `offset=${offset}&`;
    if (unreadOnly) url += `unreadOnly=${unreadOnly}&`;
    
    return fetchWithAuth(url);
  },
  
  // Отметить уведомление как прочитанное
  markAsRead: (notificationId) => fetchWithAuth(`/api/notifications/${notificationId}/read`, {
    method: 'POST'
  }),
  
  // Отметить все уведомления как прочитанные
  markAllAsRead: () => fetchWithAuth('/api/notifications/read-all', {
    method: 'POST'
  }),
  
  // Удалить уведомление
  deleteNotification: (notificationId) => fetchWithAuth(`/api/notifications/${notificationId}`, {
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