import supabase from '../supabaseClient';
import userProfileService, { emitEvent } from '../userProfileService';
import translateAuthError from '../../utils/authErrorTranslator';
import { triggerUserUpdate } from '../../contexts/AuthContext';
import eventService from '../eventService';

// Константы
export const SUPER_ADMIN_EMAIL = 'igoraor79@gmail.com';

// Функция для проверки уникальности имени пользователя
export const checkDisplayNameUnique = async (displayName, excludeUserId = null) => {
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

// Check if a user is banned
export const checkUserBan = async (userId) => {
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
};

const authCore = {
  // Регистрация нового пользователя
  async register(userData) {
    try {
      const { email, password, displayName } = userData;
      
      console.log('authCore: Начинаем регистрацию пользователя:', { email, displayName });
      
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
      
      console.log('authCore: Пользователь зарегистрирован в Supabase:', data.user.id);
      
      // Создаем запись профиля сразу после регистрации
      try {
        // Проверим, существует ли уже профиль
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('authCore: Ошибка при проверке профиля:', checkError);
        }
        
        if (!existingProfile) {
          console.log('authCore: Создаем новый профиль пользователя');
          // Создаем новый профиль
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              display_name: displayName,
              avatar: null,
              created_at: new Date().toISOString(),
              perks: ['user'],
              active_perk: 'user'
            });
            
          if (insertError) {
            console.error('authCore: Ошибка при создании профиля:', insertError);
          }
        }
      } catch (profileError) {
        console.error('authCore: Ошибка при работе с профилем:', profileError);
      }
      
      // Обрабатываем event-перки для нового пользователя
      const addedPerks = await eventService.processEventPerksForNewUser(data.user.id);
      console.log('authCore: Добавлены перки:', addedPerks);
      
      // Если user получил перк early_user, добавляем его
      const userPerks = addedPerks.includes('early_user') ? ['user', 'early_user'] : ['user'];
      
      // Создаем объект пользователя
      const user = {
        id: data.user.id,
        email: data.user.email,
        displayName: displayName,
        role: 'user',
        perks: userPerks,
        activePerk: userPerks.includes('early_user') ? 'early_user' : 'user',
        createdAt: data.user.created_at
      };
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(user.id, {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: null,
        perks: userPerks,
        activePerk: user.activePerk
      });
      
      // Принудительное обновление профиля в базе данных
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            perks: userPerks,
            active_perk: user.activePerk
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('authCore: Ошибка при обновлении перков в профиле:', updateError);
        }
      } catch (updateError) {
        console.error('authCore: Ошибка при обновлении профиля:', updateError);
      }
      
      // Автоматически входим в систему после регистрации
      const loginResult = await this.autoLogin(data.user);
      console.log('authCore: Результат автоматического входа:', loginResult);
      
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

  // Автоматический вход после регистрации
  async autoLogin(user) {
    try {
      // Проверяем, забанен ли пользователь
      const banStatus = await checkUserBan(user.id);
      if (banStatus.is_banned) {
        throw new Error(`Ваш аккаунт заблокирован: ${banStatus.reason}. Окончание блокировки: ${banStatus.end_at ? new Date(banStatus.end_at).toLocaleString() : 'Бессрочно'}`);
      }
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = user.email === 'igoraor79@gmail.com';
      
      // Получаем данные профиля из таблицы profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Ошибка при получении профиля:', profileError);
      }
      
      // Если у пользователя нет привилегий, устанавливаем базовую привилегию "Пользователь"
      if (!profileData?.perks || (Array.isArray(profileData?.perks) && profileData.perks.length === 0)) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            perks: ['user'],
            active_perk: 'user'
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Ошибка при установке базовой привилегии:', updateError);
        }
      }
      
      // Получаем дополнительные данные о пользователе
      let perks = ['user']; // дефолтное значение
      
      // Правильно обрабатываем perks в зависимости от типа данных
      if (profileData?.perks) {
        if (typeof profileData.perks === 'string') {
          // Если perks хранится как JSON-строка, преобразуем её в массив
          try {
            perks = JSON.parse(profileData.perks);
          } catch (e) {
            console.error('Ошибка при парсинге перков:', e);
          }
        } else if (Array.isArray(profileData.perks)) {
          // Если perks уже является массивом, используем как есть
          perks = profileData.perks;
        }
      }
      
      // Добавляем admin, если это админский email
      if (isAdmin && !perks.includes('admin')) {
        perks.push('admin');
      }
      
      // ВАЖНО: Приоритет отдаем данным из profiles, а не из метаданных auth.users
      const userData = {
        id: user.id,
        email: user.email,
        // Приоритет - данные из profiles
        displayName: profileData?.display_name || user.user_metadata.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (profileData?.role || user.user_metadata.role || 'user'),
        createdAt: user.created_at,
        avatar: profileData?.avatar || user.user_metadata.avatar || null,
        perks: perks,
        activePerk: profileData?.active_perk || perks[0] || 'user'
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
      
      // Отправка события обновления пользователя
      triggerUserUpdate(userData);
      
      return userData;
    } catch (error) {
      console.error('Ошибка при автоматическом входе:', error);
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
      const banStatus = await checkUserBan(data.user.id);
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
      if (!profileData?.perks || (Array.isArray(profileData?.perks) && profileData.perks.length === 0)) {
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
      let perks = ['user']; // дефолтное значение
      
      // Правильно обрабатываем perks в зависимости от типа данных
      if (profileData?.perks) {
        if (typeof profileData.perks === 'string') {
          // Если perks хранится как JSON-строка, преобразуем её в массив
          try {
            perks = JSON.parse(profileData.perks);
          } catch (e) {
            console.error('Ошибка при парсинге перков:', e);
          }
        } else if (Array.isArray(profileData.perks)) {
          // Если perks уже является массивом, используем как есть
          perks = profileData.perks;
        }
      }
      
      // Добавляем admin, если это админский email
      if (isAdmin && !perks.includes('admin')) {
        perks.push('admin');
      }
      
      // ВАЖНО: Приоритет отдаем данным из profiles, а не из метаданных auth.users
      const userData = {
        id: data.user.id,
        email: data.user.email,
        // Приоритет - данные из profiles
        displayName: profileData?.display_name || data.user.user_metadata.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (profileData?.role || data.user.user_metadata.role || 'user'),
        createdAt: data.user.created_at,
        avatar: profileData?.avatar || data.user.user_metadata.avatar || null,
        perks: perks,
        activePerk: profileData?.active_perk || perks[0] || 'user'
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
  
  // Проверка, авторизован ли пользователь
  isAuthenticated() {
    return !!localStorage.getItem('user');
  },

  // Получение токена
  getToken() {
    const { data } = supabase.auth.getSession();
    return data?.session?.access_token || null;
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

  // Explicitly expose the checkUserBan function
  checkUserBan
};

export default authCore; 