import supabase from './supabaseClient';

// Кеш для хранения данных профилей пользователей (время жизни кеша - 5 минут)
const userProfileCache = new Map();
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 минут

// Добавляем механизм событий для оповещения о изменениях в профиле
const eventListeners = {
  profileUpdated: []
};

// Функция для добавления слушателя события
const addListener = (eventName, callback) => {
  if (!eventListeners[eventName]) {
    eventListeners[eventName] = [];
  }
  eventListeners[eventName].push(callback);
  
  // Возвращаем функцию для отписки
  return () => {
    eventListeners[eventName] = eventListeners[eventName].filter(
      listener => listener !== callback
    );
  };
};

// Функция для генерации события
const emitEvent = (eventName, data) => {
  if (eventListeners[eventName]) {
    eventListeners[eventName].forEach(callback => callback(data));
  }
};

// Сервис для работы с профилями пользователей
const userProfileService = {
  // Получение информации о пользователе по ID
  async getUserProfile(userId) {
    try {
      // Проверяем, есть ли профиль в кеше и обновляем их для админа всегда
      if (userId === 'ca7fe23e-f263-4372-8aac-a652791e724c') {
        userProfileCache.delete(userId); // Принудительно обновляем данные администратора
      } else if (userProfileCache.has(userId)) {
        return userProfileCache.get(userId);
      }
      
      console.log(`Получение профиля для пользователя: ${userId}`);
      
      // 1. Сначала пробуем получить данные из таблицы profiles напрямую
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!profileError && profileData) {
          console.log('Получены данные из profiles:', profileData);
          
          const userProfile = {
            id: profileData.id,
            displayName: profileData.display_name || 'Пользователь',
            email: profileData.email,
            avatar: profileData.avatar || null,
            role: profileData.role || 'user',
            createdAt: profileData.created_at,
            // Добавляем информацию о привилегиях
            perks: profileData.perks || ['user'],
            activePerk: profileData.active_perk || profileData.perks?.[0] || 'user'
          };
          
          // Сохраняем в кеш с ограниченным временем жизни
          userProfileCache.set(userId, userProfile);
          setTimeout(() => userProfileCache.delete(userId), CACHE_LIFETIME);
          
          return userProfile;
        }
      } catch (profilesError) {
        console.error('Ошибка при получении профиля из profiles:', profilesError);
      }
      
      // 2. Пробуем получить данные из представления public_profiles
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!profileError && profileData) {
          console.log('Получены данные из public_profiles:', profileData);
          
          const userProfile = {
            id: profileData.id,
            displayName: profileData.display_name || profileData.email?.split('@')[0] || 'Пользователь',
            email: profileData.email,
            avatar: profileData.avatar || null,
            role: profileData.role || 'user',
            createdAt: profileData.created_at,
            // Пытаемся получить привилегии из профиля
            perks: profileData.perks || ['user'],
            activePerk: profileData.active_perk || 'user'
          };
          
          // Сохраняем в кеш с ограниченным временем жизни
          userProfileCache.set(userId, userProfile);
          setTimeout(() => userProfileCache.delete(userId), CACHE_LIFETIME);
          
          return userProfile;
        }
      } catch (profileViewError) {
        console.error('Ошибка при получении профиля из public_profiles:', profileViewError);
      }
      
      // 3. Если текущий пользователь - пытаемся получить данные из сессии
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionError && sessionData?.session?.user && sessionData.session.user.id === userId) {
          const user = sessionData.session.user;
          const metadata = user.user_metadata || {};
          
          console.log('Получены данные из текущей сессии:', user);
          
          // Получаем дополнительные данные о привилегиях из profiles
          let perks = ['user'];
          let activePerk = 'user';
          
          try {
            const { data: profilePerks } = await supabase
              .from('profiles')
              .select('perks, active_perk')
              .eq('id', userId)
              .single();
              
            if (profilePerks) {
              perks = profilePerks.perks || ['user'];
              activePerk = profilePerks.active_perk || perks[0] || 'user';
            }
          } catch (e) {
            console.error('Не удалось получить привилегии из profiles:', e);
          }
          
          const userProfile = {
            id: userId,
            displayName: metadata.display_name || user.email?.split('@')[0] || 'Пользователь',
            email: user.email,
            avatar: metadata.avatar || null,
            role: metadata.role || 'user',
            createdAt: user.created_at,
            perks: perks,
            activePerk: activePerk
          };
          
          // Сохраняем в кеш с ограниченным временем жизни
          userProfileCache.set(userId, userProfile);
          setTimeout(() => userProfileCache.delete(userId), CACHE_LIFETIME);
          
          return userProfile;
        }
      } catch (sessionError) {
        console.error('Ошибка при получении данных сессии:', sessionError);
      }
      
      // Если ничего не помогло, возвращаем базовый профиль
      console.log('Возвращаем базовый профиль для пользователя:', userId);
      return {
        id: userId,
        displayName: 'Пользователь',
        email: null,
        avatar: null,
        role: 'user',
        createdAt: new Date().toISOString(),
        perks: ['user'],
        activePerk: 'user'
      };
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      
      // В случае ошибки возвращаем базовый профиль
      return {
        id: userId,
        displayName: 'Пользователь',
        email: null,
        avatar: null,
        role: 'user',
        createdAt: new Date().toISOString(),
        perks: ['user'],
        activePerk: 'user'
      };
    }
  },
  
  // Обновление профиля в кеше
  updateProfileCache(userId, profileData) {
    if (userProfileCache.has(userId)) {
      const currentProfile = userProfileCache.get(userId);
      const updatedProfile = { ...currentProfile, ...profileData };
      userProfileCache.set(userId, updatedProfile);
      console.log('Обновлен кеш профиля для:', userId, updatedProfile);
      
      // Обновляем время жизни кеша
      setTimeout(() => userProfileCache.delete(userId), CACHE_LIFETIME);
      
      // Генерируем событие об обновлении профиля
      emitEvent('profileUpdated', { userId, profileData: updatedProfile });
    }
  },
  
  // Обновление профиля пользователя в базе данных
  async updateUserProfile(userId, profileData) {
    try {
      // Обновляем профиль в базе данных
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      // Обновляем кеш
      this.updateProfileCache(userId, profileData);
      
      // Полностью очищаем кеш, чтобы данные обновились при следующем запросе
      this.clearCache();
      
      return data;
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      throw error;
    }
  },
  
  // Очистка кеша
  clearCache() {
    console.log('Полная очистка кеша профилей');
    userProfileCache.clear();
  },
  
  // Получение текущего пользователя из localStorage
  getCurrentUserFromStorage() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении пользователя из localStorage:', error);
      return null;
    }
  },
  
  // Add method to clear profile cache for a user
  clearProfileCache(userId) {
    if (userId) {
      userProfileCache.delete(userId);
      console.log(`Cleared profile cache for user ${userId}`);
    }
  },
  
  // Get cached profile data for a user
  getCachedProfile(userId) {
    if (userId && userProfileCache.has(userId)) {
      return userProfileCache.get(userId);
    }
    return null;
  }
};

// Экспортируем функционал событий
export { addListener, emitEvent };

export default userProfileService; 