import supabase from './supabaseClient';
import userProfileService, { emitEvent } from './userProfileService';
import translateAuthError from '../utils/authErrorTranslator';

// Тестовые (моковые) данные для разработки - не используются, но оставляем на всякий случай
const mockUserData = {
  id: '123456',
  email: 'test@example.com',
  displayName: 'Тестовый Пользователь',
  role: 'user',
  avatar: 'https://via.placeholder.com/150'
};

// Функция для проверки уникальности имени пользователя
const checkDisplayNameUnique = async (displayName, excludeUserId = null) => {
  try {
    let query = supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', displayName);
      
    // Если указан ID пользователя для исключения из проверки
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Ошибка при проверке уникальности имени:', error);
      return false; // Возвращаем false при ошибке, чтобы не блокировать регистрацию
    }
    
    // Если есть записи, имя не уникально
    return data.length === 0;
  } catch (error) {
    console.error('Ошибка при проверке уникальности имени:', error);
    return false; // Возвращаем false при ошибке, чтобы не блокировать регистрацию
  }
};

const authService = {
  // Регистрация нового пользователя
  async register(userData) {
    try {
      const { email, password, displayName } = userData;
      
      // Проверяем уникальность имени пользователя
      const isNameUnique = await checkDisplayNameUnique(displayName);
      if (!isNameUnique) {
        throw new Error('Пользователь с таким именем уже существует');
      }
      
      // Регистрируем пользователя через Supabase Auth - максимально просто
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      
      if (error) {
        throw new Error(translateAuthError(error.message) || 'Ошибка при регистрации');
      }
      
      // Создаем объект пользователя
      const user = {
        id: data.user.id,
        email: data.user.email,
        displayName: displayName,
        role: 'user',
        perks: ['user'],
        activePerk: 'user',
        createdAt: data.user.created_at
      };
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(user.id, {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: null,
        perks: ['user'],
        activePerk: 'user'
      });
      
      return { user };
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      // Перевод сообщения об ошибке
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
      throw error;
    }
  },

  // Авторизация пользователя
  async login(credentials) {
    try {
      const { email, password } = credentials;
      
      // Авторизуем пользователя через Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error(translateAuthError(error.message) || 'Ошибка при входе');
      }
      
      // Проверяем, забанен ли пользователь
      const banStatus = await this.checkUserBan(data.user.id);
      if (banStatus.is_banned) {
        throw new Error(`Ваш аккаунт заблокирован: ${banStatus.reason}. Окончание блокировки: ${banStatus.end_at ? new Date(banStatus.end_at).toLocaleString() : 'Бессрочно'}`);
      }
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = email === 'igoraor79@gmail.com';
      
      // Получаем данные профиля из таблицы profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Ошибка при получении профиля:', profileError);
      }
      
      // Если у пользователя нет привилегий, устанавливаем базовую привилегию "Пользователь"
      if (!profileData?.perks || profileData.perks.length === 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            perks: ['user'],
            active_perk: 'user'
          })
          .eq('id', data.user.id);
          
        if (updateError) {
          console.error('Ошибка при установке базовой привилегии:', updateError);
        }
      }
      
      // Получаем дополнительные данные о пользователе
      const userData = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (data.user.user_metadata.role || 'user'),
        createdAt: data.user.created_at,
        avatar: data.user.user_metadata.avatar || null,
        perks: profileData?.perks || ['user'],
        activePerk: profileData?.active_perk || profileData?.perks?.[0] || 'user'
      };
      
      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(userData.id, {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        perks: userData.perks,
        activePerk: userData.activePerk
      });
      
      return {
        user: userData,
        token: data.session.access_token
      };
    } catch (error) {
      console.error('Ошибка при входе:', error);
      // Перевод сообщения об ошибке
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
      throw error;
    }
  },

  // Выход из системы
  async logout() {
    try {
      // Выход из Supabase Auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(translateAuthError(error.message) || 'Ошибка при выходе');
      }
      
      // Удаляем данные пользователя из localStorage
      localStorage.removeItem('user');
      
      // Очищаем кеш профилей
      userProfileService.clearCache();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Перевод сообщения об ошибке
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
      throw error;
    }
  },

  // Check if a user is banned
  async checkUserBan(userId) {
    if (!userId) return { is_banned: false };
    
    try {
      // First check if the required columns exist to prevent errors
      try {
        // Try to get the profile with minimal fields first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error('Error accessing profiles table:', profileError);
          return { is_banned: false };
        }
      } catch (error) {
        console.error('Error during preliminary profile check:', error);
        return { is_banned: false };
      }
      
      // Now try to get the ban information
      try {
        // Получаем профиль пользователя
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned, ban_reason, ban_end_at, ban_admin_name')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          // Check specifically for column not exist error
          if (profileError.message && profileError.message.includes('does not exist')) {
            console.warn('Ban columns do not exist yet in profiles table');
            return { is_banned: false };
          }
          console.error('Error checking ban status:', profileError);
          return { is_banned: false };
        }
        
        // If is_banned is null or false, user is not banned
        if (!profile.is_banned) {
          return { is_banned: false };
        }
        
        // Если есть срок окончания блокировки, проверяем, не истек ли он
        if (profile.ban_end_at) {
          const banEndDate = new Date(profile.ban_end_at);
          const now = new Date();
          
          // Если срок блокировки истек, разблокируем пользователя автоматически
          if (banEndDate < now) {
            // Обновляем флаг блокировки в профиле
            await supabase
              .from('profiles')
              .update({ 
                is_banned: false,
                ban_reason: null,
                ban_end_at: null,
                ban_admin_id: null,
                ban_admin_name: null
              })
              .eq('id', userId);
              
            // Обновляем статус блокировки в таблице user_bans
            try {
              await supabase
                .from('user_bans')
                .update({ is_active: false })
                .eq('user_id', userId)
                .eq('is_active', true);
            } catch (error) {
              // Silently handle error if user_bans table doesn't exist yet
              console.warn('Could not update user_bans table:', error);
            }
              
            return { is_banned: false };
          }
        }
        
        // Try to get additional ban information from user_bans table
        try {
          // Получаем дополнительную информацию о блокировке
          const { data: banData, error: banError } = await supabase
            .from('user_bans')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (banError) {
            // If we get an error here, it might be because the table doesn't exist yet
            console.warn('Could not access user_bans table:', banError);
            // Return data from profile only
            return {
              is_banned: true,
              reason: profile.ban_reason,
              end_at: profile.ban_end_at,
              admin_name: profile.ban_admin_name
            };
          }
          
          if (!banData || banData.length === 0) {
            // No ban record found in user_bans table
            return {
              is_banned: true,
              reason: profile.ban_reason,
              end_at: profile.ban_end_at,
              admin_name: profile.ban_admin_name
            };
          }
          
          // Возвращаем полную информацию о блокировке
          return {
            is_banned: true,
            reason: banData[0].reason,
            end_at: banData[0].end_at,
            admin_name: banData[0].admin_name,
            created_at: banData[0].created_at,
            ban_type: banData[0].ban_type
          };
        } catch (banTableError) {
          console.warn('Error accessing user_bans table:', banTableError);
          // Return data from profile only
          return {
            is_banned: true,
            reason: profile.ban_reason,
            end_at: profile.ban_end_at,
            admin_name: profile.ban_admin_name
          };
        }
      } catch (profileError) {
        console.error('Error checking ban in profiles:', profileError);
        return { is_banned: false };
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
      return { is_banned: false };
    }
  },

  // Получение текущего пользователя
  async getCurrentUser() {
    try {
      // Проверяем наличие пользователя в localStorage (для быстрого доступа)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        
        // Обновляем кеш профилей
        userProfileService.updateProfileCache(userData.id, {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          avatar: userData.avatar,
          perks: userData.perks || [],
          activePerk: userData.activePerk
        });
        
        return userData;
      }
      
      // Если пользователя нет в localStorage, проверяем сессию в Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        return null;
      }
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = data.session.user.email === 'igoraor79@gmail.com';
      
      // Получаем данные профиля из таблицы profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Ошибка при получении профиля:', profileError);
      }
      
      // Если у пользователя нет привилегий, устанавливаем базовую привилегию "Пользователь"
      if (!profileData?.perks || profileData.perks.length === 0) {
        try {
          await supabase
            .from('profiles')
            .update({ 
              perks: ['user'],
              active_perk: 'user'
            })
            .eq('id', data.session.user.id);
        } catch (updateError) {
          console.error('Ошибка при установке базовой привилегии:', updateError);
        }
      }
      
      // Создаем объект пользователя
      const userData = {
        id: data.session.user.id,
        email: data.session.user.email,
        displayName: data.session.user.user_metadata.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (data.session.user.user_metadata.role || 'user'),
        createdAt: data.session.user.created_at,
        avatar: data.session.user.user_metadata.avatar || null,
        perks: profileData?.perks || ['user'],
        activePerk: profileData?.active_perk || profileData?.perks?.[0] || 'user'
      };
      
      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(userData.id, {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        perks: userData.perks,
        activePerk: userData.activePerk
      });
      
      return userData;
    } catch (error) {
      console.error('Ошибка при получении текущего пользователя:', error);
      return null;
    }
  },

  // Получение информации о пользователе по ID
  async getUserById(userId) {
    try {
      // Проверяем наличие пользователя в кеше
      const cachedUser = userProfileService.getCachedProfile(userId);
      if (cachedUser) {
        return cachedUser;
      }
      
      // Если нет в кеше, получаем данные из Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw new Error(error.message || 'Ошибка при получении профиля');
      }
      
      if (!data) {
        throw new Error('Пользователь не найден');
      }
      
      // Создаем объект пользователя
      const userData = {
        id: data.id,
        displayName: data.display_name || 'Пользователь',
        email: data.email,
        role: data.role || 'user',
        avatar: data.avatar,
        perks: data.perks || ['user'],
        activePerk: data.active_perk || 'user',
        createdAt: data.created_at,
        is_banned: data.is_banned || false,
        ban_reason: data.ban_reason,
        ban_end_at: data.ban_end_at,
        ban_admin_name: data.ban_admin_name
      };
      
      // Кешируем результат
      userProfileService.updateProfileCache(userId, userData);
      
      return userData;
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      throw error;
    }
  },

  // Обновление аватара пользователя
  async updateAvatar(avatarPath) {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Пользователь не авторизован');
      }
      
      const userId = sessionData.session.user.id;
      
      // Обновляем метаданные пользователя
      const { data, error } = await supabase.auth.updateUser({
        data: { avatar: avatarPath }
      });
      
      if (error) {
        throw new Error(error.message || 'Ошибка при обновлении аватара');
      }
      
      // Также обновляем аватар в таблице profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar: avatarPath })
        .eq('id', userId);
        
      if (profileError) {
        console.error('Ошибка при обновлении аватара в профиле:', profileError);
      }
      
      // Обновляем данные пользователя в localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.avatar = avatarPath;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Обновляем кеш профилей
        userProfileService.updateProfileCache(userId, { avatar: avatarPath });
        
        // Генерируем событие для немедленного уведомления всех компонентов
        emitEvent('profileUpdated', { 
          userId, 
          profileData: { ...userData, avatar: avatarPath } 
        });
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении аватара:', error);
      throw error;
    }
  },
  
  // Проверка, авторизован ли пользователь
  isAuthenticated() {
    return !!localStorage.getItem('user');
  },

  // Получение токена
  getToken() {
    const { data } = supabase.auth.getSession();
    return data?.session?.access_token || null;
  },

  // Обновление активной привилегии пользователя
  async updateActivePerk(activePerk, onUpdateComplete = null) {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Пользователь не авторизован');
      }
      
      const userId = sessionData.session.user.id;
      
      // Обновляем активную привилегию в профиле
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ active_perk: activePerk })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(updateError.message || 'Ошибка при обновлении привилегии');
      }
      
      // Обновляем данные пользователя в localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.activePerk = activePerk;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Обновляем кеш профилей
        userProfileService.updateProfileCache(userId, { activePerk });
        
        // Генерируем событие для немедленного уведомления всех компонентов
        emitEvent('profileUpdated', { 
          userId, 
          profileData: { ...userData, activePerk } 
        });
      }
      
      // Вызываем коллбэк для моментального обновления пользователя в AuthContext
      if (onUpdateComplete && typeof onUpdateComplete === 'function') {
        await onUpdateComplete();
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении активной привилегии:', error);
      throw error;
    }
  },

  // Обновление данных пользователя (имя)
  async updateDisplayName(newDisplayName, password, onUpdateComplete = null) {
    try {
      // Получаем текущую сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Пользователь не авторизован');
      }
      
      const userId = sessionData.session.user.id;
      const userEmail = sessionData.session.user.email;
      
      // Проверяем пароль, пытаясь выполнить повторный вход
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });
      
      if (signInError) {
        throw new Error('Неверный пароль');
      }
      
      // Проверяем уникальность нового имени пользователя (исключая текущего пользователя)
      const isNameUnique = await checkDisplayNameUnique(newDisplayName, userId);
      if (!isNameUnique) {
        throw new Error('Пользователь с таким именем уже существует');
      }
      
      // Обновляем метаданные пользователя в Auth
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: newDisplayName }
      });
      
      if (error) {
        throw new Error(error.message || 'Ошибка при обновлении имени');
      }
      
      // Также обновляем имя в таблице profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: newDisplayName })
        .eq('id', userId);
        
      if (profileError) {
        console.error('Ошибка при обновлении имени в профиле:', profileError);
      }
      
      // Обновляем данные пользователя в localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.displayName = newDisplayName;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Обновляем кеш профилей
        userProfileService.updateProfileCache(userId, { displayName: newDisplayName });
        
        // Генерируем событие для немедленного уведомления всех компонентов
        emitEvent('profileUpdated', { 
          userId, 
          profileData: { ...userData, displayName: newDisplayName } 
        });
      }
      
      // Вызываем коллбэк для обновления состояния
      if (onUpdateComplete && typeof onUpdateComplete === 'function') {
        await onUpdateComplete();
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении имени пользователя:', error);
      throw error;
    }
  },
  
  // Изменение пароля пользователя
  async changePassword(currentPassword, newPassword) {
    try {
      // Получаем текущую сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error(translateAuthError("You must log in to perform this action"));
      }
      
      const userEmail = sessionData.session.user.email;
      
      // Проверяем текущий пароль, пытаясь выполнить повторный вход
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error('Неверный текущий пароль');
      }
      
      // Обновляем пароль
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw new Error(translateAuthError(error.message) || 'Ошибка при изменении пароля');
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      // Перевод сообщения об ошибке
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
      throw error;
    }
  },

  // Сброс пароля
  async resetPassword(email) {
    try {
      // Определяем корректный URL для перенаправления
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      if (error) {
        throw new Error(translateAuthError(error.message) || 'Ошибка при сбросе пароля');
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      // Перевод сообщения об ошибке
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
      throw error;
    }
  },
  
  // Refresh current user data
  async refreshCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        localStorage.removeItem('user');
        return null;
      }
      
      // Get fresh profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile during refresh:', profileError);
        return null;
      }
      
      // Determine if user is admin
      const isAdmin = data.session.user.email === 'igoraor79@gmail.com';
      
      // Create updated user object
      const userData = {
        id: data.session.user.id,
        email: data.session.user.email,
        displayName: profileData.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (profileData.role || 'user'),
        createdAt: data.session.user.created_at,
        avatar: profileData.avatar || null,
        perks: profileData.perks || ['user'],
        activePerk: profileData.active_perk || 'user'
      };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update profile cache
      userProfileService.updateProfileCache(userData.id, {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        perks: userData.perks,
        activePerk: userData.activePerk
      });
      
      // Trigger global update event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('app:user:updated', { detail: userData });
        window.dispatchEvent(event);
      }
      
      return userData;
    } catch (error) {
      console.error('Error refreshing current user:', error);
      return null;
    }
  }
};

export default authService; 