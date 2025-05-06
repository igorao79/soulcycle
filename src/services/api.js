// Режим разработки/продакшена
const IS_DEV = import.meta.env.DEV;
// Режим отладки запросов
const DEBUG_MODE = true;

// Базовый URL для API
// В режиме разработки используем прокси через Vite
// Пустая строка означает, что запросы будут идти через прокси на локальном сервере
const BASE_API_URL = '';

// Функция для проверки CORS заголовков и отладки ответа
const debugResponse = async (response, url) => {
  if (!DEBUG_MODE) return;
  
  console.group(`📡 Ответ от API (${url})`);
  console.log('Статус:', response.status);
  console.log('Все заголовки:', Object.fromEntries([...response.headers.entries()]));
  console.groupEnd();
};

// Базовая функция для выполнения запросов
const fetchData = async (url, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Создаем полные опции запроса
    const fetchOptions = {
      ...options,
      headers
    };
    
    if (DEBUG_MODE) {
      console.group(`📤 Отправка запроса`);
      console.log('URL:', url);
      console.log('Метод:', options.method || 'GET');
      if (options.body) {
        console.log('Тело запроса:', JSON.parse(options.body));
      }
      console.groupEnd();
    }
    
    // Выполняем запрос
    const response = await fetch(url, fetchOptions);
    
    if (DEBUG_MODE) {
      await debugResponse(response, url);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ошибка ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    if (response.status === 204) {
      return null;
    }
    
    // Проверяем тип контента для правильного парсинга
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (DEBUG_MODE) {
        console.log('Ответ:', data);
      }
      return data;
    } else {
      const text = await response.text();
      if (DEBUG_MODE) {
        console.log('Ответ (текст):', text);
      }
      return text;
    }
  } catch (error) {
    console.error('Ошибка при запросе данных:', error);
    throw error;
  }
};

// API для работы с постами
export const postsApi = {
  // Получить все посты - переведено на Supabase
  getPosts: () => {
    // Этот метод теперь используется из postService, который работает с Supabase напрямую
    console.warn('Используйте postService.getPosts() вместо этого метода');
    return { message: 'Используйте postService.getPosts() вместо этого метода' };
  },
  
  // Получить конкретный пост
  getPost: (postId) => {
    // Этот метод теперь используется из postService, который работает с Supabase напрямую
    console.warn('Используйте postService.getPostById() вместо этого метода');
    return { message: 'Используйте postService.getPostById() вместо этого метода' };
  },
  
  // Поиск постов
  searchPosts: (query) => {
    // Этот метод теперь используется из postService, который работает с Supabase напрямую
    console.warn('Используйте postService.searchPosts() вместо этого метода');
    return { message: 'Используйте postService.searchPosts() вместо этого метода' };
  }
};

// API для работы с комментариями
export const commentsApi = {
  // Получить комментарии для поста
  getComments: (postId) => {
    // Этот метод теперь используется из commentService, который работает с Supabase напрямую
    console.warn('Используйте commentService.getCommentsByPostId() вместо этого метода');
    return { message: 'Используйте commentService.getCommentsByPostId() вместо этого метода' };
  },
  
  // Добавить комментарий
  addComment: (commentData) => {
    // Этот метод теперь используется из commentService, который работает с Supabase напрямую
    console.warn('Используйте commentService.createComment() вместо этого метода');
    return { message: 'Используйте commentService.createComment() вместо этого метода' };
  }
};

export default {
  postsApi,
  commentsApi
};