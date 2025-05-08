import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import supabase from '../services/supabaseClient';
import userProfileService, { addListener } from '../services/userProfileService';
import BanModal from '../components/Auth/BanModal';

// Кастомное событие для синхронизации обновлений UI
export const USER_UPDATED_EVENT = 'app:user:updated';

// Функция для создания события обновления пользователя
export const triggerUserUpdate = (userData) => {
  const event = new CustomEvent(USER_UPDATED_EVENT, { detail: userData });
  window.dispatchEvent(event);
};

// Создаем контекст
const AuthContext = createContext(null);

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banInfo, setBanInfo] = useState(null);

  // Загружаем пользователя при инициализации
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Проверяем, действительна ли сессия Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Если сессии нет или она невалидна, очищаем localStorage и не авторизуем пользователя
        if (sessionError || !sessionData.session) {
          localStorage.removeItem('user');
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Проверяем, не заблокирован ли пользователь
        const banStatus = await authService.checkUserBan(sessionData.session.user.id);
        if (banStatus.is_banned) {
          setBanInfo(banStatus);
          await authService.logout();
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Получаем данные пользователя
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Если пользователь не найден, выполняем выход
          await authService.logout();
        }
      } catch (error) {
        console.error("Ошибка при инициализации auth:", error);
        // При ошибке очищаем данные пользователя
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Функция для обновления данных текущего пользователя
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Проверяем, не заблокирован ли пользователь
      const banStatus = await authService.checkUserBan(user.id);
      if (banStatus.is_banned) {
        setBanInfo(banStatus);
        await authService.logout();
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Получаем актуальные данные профиля из базы данных
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Ошибка при обновлении пользователя:", profileError);
        return;
      }
      
      // Если отсутствуют перки, устанавливаем базовый "user"
      if (!profileData.perks || profileData.perks.length === 0) {
        profileData.perks = ['user'];
        profileData.active_perk = 'user';
      }
      
      // Если активный перк больше не существует в списке перков, 
      // устанавливаем первый из списка или "user"
      if (!profileData.perks.includes(profileData.active_perk)) {
        profileData.active_perk = profileData.perks[0] || 'user';
      }
      
      // Обновляем пользователя
      const updatedUser = {
        ...user,
        displayName: profileData.display_name || user.displayName,
        avatar: profileData.avatar || user.avatar,
        perks: profileData.perks,
        activePerk: profileData.active_perk
      };
      
      // Обновляем данные в localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Вызываем глобальное событие для синхронизации всех компонентов
      triggerUserUpdate(updatedUser);
      
      // Обновляем состояние
      setUser(updatedUser);
    } catch (error) {
      console.error("Ошибка при обновлении данных пользователя:", error);
    } finally {
      setLoading(false);
    }
  };

  // Функция для входа
  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Сначала проверяем логин/пароль с помощью Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      // Затем проверяем, не заблокирован ли пользователь
      const banStatus = await authService.checkUserBan(authData.user.id);
      if (banStatus.is_banned) {
        // Если пользователь заблокирован, сразу выходим и показываем информацию о блокировке
        await authService.logout();
        setBanInfo(banStatus);
        setLoading(false);
        return null;
      }
      
      // Если все в порядке, продолжаем стандартный вход
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Функция для регистрации
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      // Автоматически устанавливаем пользователя после регистрации
      if (response && response.user) {
        setUser(response.user);
        
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Функция для авторизации через OAuth провайдеров (Google, и т.д.)
  const loginWithProvider = async (provider) => {
    try {
      setLoading(true);
      
      // Настраиваем специальные параметры для улучшения безопасности
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            // Для Google OAuth
            access_type: 'offline',
            prompt: 'consent', // Всегда запрашивать согласие на доступ
            hd: 'domain.com', // Опционально: ограничить определенным доменом
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Ошибка при входе через ${provider}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      setLoading(false);
    }
  };

  // Настраиваем прослушивание изменений в таблице профилей
  useEffect(() => {
    if (!user) return;
    
    // Подписываемся на изменения в профиле пользователя 
    const subscription = supabase
      .channel(`profile-changes-${user.id}`)
      .on('postgres_changes', 
        {
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Профиль пользователя изменен:', payload);
          refreshUser();
        }
      )
      .subscribe();
    
    // Отписываемся при размонтировании
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Настраиваем прослушивание событий профиля
  useEffect(() => {
    if (!user) return;
    
    // Подписываемся на обновления профиля пользователя из userProfileService
    const unsubscribe = addListener('profileUpdated', ({ userId, profileData }) => {
      if (user && userId === user.id) {
        console.log('AuthContext: Обнаружено изменение профиля через событие', profileData);
        
        // Объединяем текущие данные пользователя с обновленными данными профиля
        const updatedUser = {
          ...user,
          displayName: profileData.displayName || user.displayName,
          avatar: profileData.avatar || user.avatar,
          perks: profileData.perks || user.perks,
          activePerk: profileData.activePerk || user.activePerk
        };
        
        // Обновляем данные в localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Вызываем глобальное событие для синхронизации всех компонентов
        triggerUserUpdate(updatedUser);
        
        // Обновляем состояние
        setUser(updatedUser);
        
        // Используем dispatchEvent для оповещения других вкладок/окон
        const event = new StorageEvent('storage', {
          key: 'user',
          newValue: JSON.stringify(updatedUser),
          url: window.location.href
        });
        window.dispatchEvent(event);
      }
    });
    
    // Отписываемся при размонтировании
    return () => unsubscribe();
  }, [user]);

  // Функция закрытия модального окна с информацией о блокировке
  const closeBanModal = () => {
    setBanInfo(null);
  };

  // Предоставляем контекст
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loginWithProvider,
        loading,
        refreshUser,
        isAuthenticated: !!user
      }}
    >
      {children}
      
      {/* Модальное окно с информацией о блокировке */}
      {banInfo && <BanModal banInfo={banInfo} onClose={closeBanModal} />}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export default AuthContext; 