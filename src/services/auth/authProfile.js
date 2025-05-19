import supabase from '../supabaseClient';
import userProfileService, { emitEvent } from '../userProfileService';
import { checkDisplayNameUnique } from './authCore';
import translateAuthError from '../../utils/authErrorTranslator';
import { triggerUserUpdate } from '../../contexts/AuthContext';

// Добавим функцию для прямого обновления имени в DOM
const updateDisplayNameInUI = (newDisplayName) => {
  try {
    // 1. Найти все элементы в DOM, которые могут содержать имя пользователя
    const usernameElements = document.querySelectorAll('.username, [data-user-displayname]');
    
    // 2. Обновить текст этих элементов
    usernameElements.forEach(element => {
      if (element.classList.contains('username') || element.hasAttribute('data-user-displayname')) {
        element.textContent = newDisplayName;
      }
    });
    
    console.log(`Прямое обновление ${usernameElements.length} элементов имени пользователя в DOM`);
  } catch (error) {
    console.error('Ошибка при прямом обновлении DOM:', error);
  }
};

const authProfile = {
  // Получение текущего пользователя
  async getCurrentUser() {
    try {
      // Получаем текущую сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Ошибка при получении сессии');
      }
      
      const session = sessionData.session;
      
      if (!session) {
        return null;
      }
      
      // Получаем данные профиля из базы
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Ошибка при получении профиля из базы:', profileError);
      }
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = session.user.email === 'igoraor79@gmail.com';
      
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
      // Это критично для синхронизации имени, установленного администратором
      const userData = {
        id: session.user.id,
        email: session.user.email,
        // Исправлено: Приоритет отдаем profiles.display_name
        displayName: profileData?.display_name || session.user.user_metadata.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (profileData?.role || session.user.user_metadata.role || 'user'),
        avatar: profileData?.avatar || session.user.user_metadata.avatar,
        perks: perks,
        activePerk: profileData?.active_perk || perks[0] || 'user',
        createdAt: session.user.created_at
      };
      
      // Если имя пользователя в метаданных auth.users не совпадает с profiles,
      // обновляем его для будущих сессий
      if (profileData?.display_name && 
          session.user.user_metadata.display_name !== profileData.display_name) {
        console.log('Синхронизация имени пользователя между profiles и auth.users...');
        try {
          // Принудительно обновляем метаданные, даже если это не текущий пользователь
          // Это гарантирует, что метаданные auth.users всегда будут соответствовать profiles
          const { error: metadataError } = await supabase.rpc('admin_update_user_metadata', {
            user_id: session.user.id,
            metadata_key: 'display_name',
            metadata_value: profileData.display_name
          });
          
          if (metadataError) {
            console.warn('Не удалось синхронизировать имя в метаданных:', metadataError);
          } else {
            console.log('Имя пользователя успешно синхронизировано');
          }
        } catch (syncError) {
          console.warn('Ошибка при синхронизации имени пользователя:', syncError);
        }
      }
      
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
      console.log('Запрос профиля из Supabase:', userId);
      
      // Получаем данные профиля из таблицы profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Ошибка при получении профиля по ID:', profileError);
        throw new Error('Не удалось получить профиль пользователя');
      }
      
      console.log('Получены данные из profiles:', profileData);
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = profileData.email === 'igoraor79@gmail.com';
      
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
      
      return {
        id: profileData.id,
        displayName: profileData.display_name,
        email: profileData.email,
        role: isAdmin ? 'admin' : (profileData.role || 'user'),
        avatar: profileData.avatar,
        perks: perks,
        activePerk: profileData.active_perk || perks[0] || 'user',
        createdAt: profileData.created_at,
        is_banned: profileData.is_banned || false,
        ban_reason: profileData.ban_reason,
        ban_end_at: profileData.ban_end_at,
        ban_admin_name: profileData.ban_admin_name
      };
    } catch (error) {
      console.error('Ошибка при получении данных пользователя по ID:', error);
      throw error;
    }
  },

  // Обновление аватара пользователя
  async updateAvatar(avatarName, targetUserId = null) {
    try {
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(translateAuthError(userError.message) || 'Ошибка при получении пользователя');
      }
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      // Определяем ID пользователя, аватар которого обновляется
      // Если targetUserId указан, используем его (для администраторов)
      const updatingUserId = targetUserId || user.id;
      
      // Если обновляется не текущий пользователь, проверяем права администратора
      if (updatingUserId !== user.id) {
        // Проверяем, является ли текущий пользователь администратором
        const isAdmin = user.email === 'igoraor79@gmail.com' || 
                        user.user_metadata?.perks?.includes('admin') || 
                        user.user_metadata?.active_perk === 'admin';
                        
        if (!isAdmin) {
          throw new Error('Недостаточно прав для изменения аватара другого пользователя');
        }
      }
      
      // Немедленно обновляем данные в localStorage если меняем аватар текущего пользователя
      // Делаем это перед асинхронными операциями для моментального обновления UI
      if (!targetUserId || targetUserId === user.id) {
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        userData.avatar = avatarName;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Отправляем глобальное событие об обновлении пользователя
        if (typeof window !== 'undefined') {
          // Генерируем событие USER_UPDATED_EVENT
          const USER_UPDATED_EVENT = 'app:user:updated';
          const event = new CustomEvent(USER_UPDATED_EVENT, { 
            detail: { ...userData, avatar: avatarName } 
          });
          window.dispatchEvent(event);
          
          // Также генерируем событие storage для других вкладок
          const storageEvent = new StorageEvent('storage', {
            key: 'user',
            newValue: JSON.stringify(userData),
            url: window.location.href
          });
          window.dispatchEvent(storageEvent);
          
          // Отправляем специальное событие обновления профиля
          emitEvent('profileUpdated', { 
            userId: updatingUserId, 
            profileData: { ...userData, avatar: avatarName } 
          });
        }
      }
      
      // Обновляем метаданные текущего пользователя только если меняем его аватар
      if (!targetUserId || targetUserId === user.id) {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            avatar: avatarName
          }
        });
        
        if (error) {
          throw new Error(translateAuthError(error.message) || 'Ошибка при обновлении аватара');
        }
      }
      
      // Обновляем данные в профиле
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar: avatarName })
        .eq('id', updatingUserId);
        
      if (profileError) {
        console.error('Ошибка при обновлении аватара в профиле:', profileError);
      }
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(updatingUserId, {
        avatar: avatarName
      });
      
      // Отправляем событие об обновлении профиля
      emitEvent('profile-updated', {
        userId: updatingUserId,
        field: 'avatar',
        value: avatarName
      });
      
      return {
        success: true,
        avatar: avatarName
      };
    } catch (error) {
      console.error('Ошибка при обновлении аватара:', error);
      // Перевод сообщения об ошибке
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
      throw error;
    }
  },

  // Обновление активной привилегии пользователя
  async updateActivePerk(perkId, userId = null, targetUserId = null) {
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      // Определяем ID пользователя для обновления
      const actualUserId = targetUserId || userId || user?.id;
      
      if (!actualUserId) {
        throw new Error("ID пользователя не указан");
      }
      
      // Update the profile table directly instead of using RPC
      const { error } = await supabase
        .from('profiles')
        .update({ active_perk: perkId })
        .eq('id', actualUserId);
      
      if (error) throw error;
      
      // Если это текущий пользователь, обновляем localStorage
      if ((!targetUserId && !userId) || user?.id === actualUserId) {
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        userData.activePerk = perkId;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Уведомляем систему об изменении
        triggerUserUpdate(userData);
      }
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(actualUserId, {
        activePerk: perkId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating active perk:', error);
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
      
      // Немедленно запускаем прямое обновление DOM для быстрой обратной связи
      updateDisplayNameInUI(newDisplayName);
      
      // ПРЯМОЕ ОБНОВЛЕНИЕ ДАННЫХ В ОБЕИХ ТАБЛИЦАХ
      
      // 1. Обновляем display_name в таблице profiles
      console.log(`Обновление display_name в таблице profiles для пользователя ${userId}`);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: newDisplayName })
        .eq('id', userId);
        
      if (profileError) {
        console.error('Ошибка при обновлении display_name в profiles:', profileError);
        throw new Error(`Ошибка при обновлении имени пользователя: ${profileError.message}`);
      }
      
      // 2. Обновляем метаданные пользователя в Auth
      console.log('Обновление метаданных пользователя в Auth');
      const { data, error: authError } = await supabase.auth.updateUser({
        data: { display_name: newDisplayName }
      });
      
      if (authError) {
        console.error('Ошибка при обновлении метаданных в Auth:', authError);
        throw new Error(`Ошибка при обновлении имени: ${authError.message}`);
      }
      
      // 3. Также используем SQL-функцию для гарантированной синхронизации
      console.log('Вызов SQL-функции sync_user_display_name для синхронизации');
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'sync_user_display_name',
        { 
          admin_id: userId,
          target_user_id: userId,
          new_display_name: newDisplayName
        }
      );
      
      if (updateError) {
        console.warn('Предупреждение: Ошибка SQL-функции sync_user_display_name:', updateError);
        // Не прерываем операцию, так как основное обновление уже выполнено
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
        
        // Вызываем глобальное событие обновления пользователя с правильным именем
        const userWithNewName = { ...userData, displayName: newDisplayName };
        
        // Добавим задержку перед вызовом глобального события, чтобы убедиться, 
        // что обновление UI произошло до других обновлений
        setTimeout(() => {
          triggerUserUpdate(userWithNewName);
          
          // Генерируем локальное событие storage для имитации изменения localStorage
          if (typeof window !== 'undefined') {
            const storageEvent = new StorageEvent('storage', {
              key: 'user',
              newValue: JSON.stringify(userWithNewName),
              url: window.location.href
            });
            window.dispatchEvent(storageEvent);
            
            // Дополнительное пользовательское событие для гарантированного обновления
            const customEvent = new CustomEvent('userDisplayNameChanged', {
              detail: { newDisplayName, userId }
            });
            window.dispatchEvent(customEvent);
          }
          
          // Вызываем коллбэк для обновления состояния только если он предоставлен
          if (onUpdateComplete && typeof onUpdateComplete === 'function') {
            onUpdateComplete();
          }
        }, 200);
      } else {
        // Вызываем коллбэк для обновления состояния только если он предоставлен
        if (onUpdateComplete && typeof onUpdateComplete === 'function') {
          onUpdateComplete();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении имени пользователя:', error);
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
      
      // Получаем также свежие данные из auth.users
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error fetching user data during refresh:', userError);
        return null;
      }
      
      // Determine if user is admin
      const isAdmin = data.session.user.email === 'igoraor79@gmail.com';
      
      // Проверяем на рассинхронизацию данных
      if (profileData.display_name !== userData.user.user_metadata.display_name) {
        console.log('Обнаружена рассинхронизация имени пользователя!');
        console.log(`Profiles: ${profileData.display_name}, Auth metadata: ${userData.user.user_metadata.display_name}`);
        
        try {
          // Синхронизируем метаданные auth с данными из profiles
          const { error: metadataError } = await supabase.rpc('admin_update_user_metadata', {
            user_id: data.session.user.id,
            metadata_key: 'display_name',
            metadata_value: profileData.display_name
          });
          
          if (metadataError) {
            console.warn('Не удалось синхронизировать имя в метаданных:', metadataError);
          } else {
            console.log('Имя пользователя успешно синхронизировано в метаданных');
          }
        } catch (syncError) {
          console.warn('Ошибка при синхронизации имени пользователя:', syncError);
        }
      }
      
      // Create updated user object
      const userDataObject = {
        id: data.session.user.id,
        email: data.session.user.email,
        // ВАЖНО: Приоритет отдаем данным из profiles
        displayName: profileData.display_name || 'Пользователь',
        role: isAdmin ? 'admin' : (profileData.role || 'user'),
        createdAt: data.session.user.created_at,
        avatar: profileData.avatar || null,
        perks: profileData.perks || ['user'],
        activePerk: profileData.active_perk || 'user'
      };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(userDataObject));
      
      // Update profile cache
      userProfileService.updateProfileCache(userDataObject.id, {
        id: userDataObject.id,
        email: userDataObject.email,
        displayName: userDataObject.displayName,
        avatar: userDataObject.avatar,
        perks: userDataObject.perks,
        activePerk: userDataObject.activePerk
      });
      
      // Trigger global update event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('app:user:updated', { detail: userDataObject });
        window.dispatchEvent(event);
      }
      
      return userDataObject;
    } catch (error) {
      console.error('Error refreshing current user:', error);
      return null;
    }
  }
};

export default authProfile; 