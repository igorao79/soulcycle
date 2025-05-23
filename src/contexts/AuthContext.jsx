import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import supabase from '../services/supabaseClient';
import userProfileService, { addListener } from '../services/userProfileService';
import BanModal from '../components/Auth/Ban/BanModal';
import translateAuthError from '../utils/authErrorTranslator';

// Кастомное событие для синхронизации обновлений UI
export const USER_UPDATED_EVENT = 'app:user:updated';

// Функция для создания события обновления пользователя
export const triggerUserUpdate = (userData) => {
  // Get current user data from localStorage to ensure we have the full object
  let completeUserData = userData;
  
  try {
    const currentUserStr = localStorage.getItem('user');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      // Merge the current user data with the updated fields
      completeUserData = { ...currentUser, ...userData };
    }
  } catch (error) {
    console.error('Error merging user data in triggerUserUpdate:', error);
  }
  
  // Create and dispatch the event with complete user data
  const event = new CustomEvent(USER_UPDATED_EVENT, { detail: completeUserData });
  window.dispatchEvent(event);
  
  console.log('triggerUserUpdate: Dispatched event with data:', completeUserData);
};

// Создаем контекст
const AuthContext = createContext(null);

// Создаем отдельный контекст для имени пользователя для мгновенных обновлений
export const UserDisplayNameContext = createContext({
  displayName: '',
  setDisplayName: () => {}
});

// Время последнего UI обновления имени пользователя
let lastUIDisplayNameUpdateTime = 0;
let manuallySetDisplayName = null;

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banInfo, setBanInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Создаем отдельное состояние для имени пользователя
  const [displayName, setDisplayName] = useState('');
  
  // Ref для отслеживания изменений и предотвращения повторных обновлений
  const previousDisplayNameRef = useRef('');

  // Эффект для инициализации пользователя при загрузке
  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true);
        
        // Получаем текущего пользователя из локального хранилища
        const userStr = localStorage.getItem('user');
        
        if (userStr) {
          const localUser = JSON.parse(userStr);
          setUser(localUser);
          setIsAuthenticated(true);
          
          // Устанавливаем имя пользователя
          if (localUser.displayName) {
            setDisplayName(localUser.displayName);
            previousDisplayNameRef.current = localUser.displayName;
          }
          
          // Обновляем данные пользователя из Supabase для получения актуальной информации
          const refreshedUser = await authService.refreshCurrentUser();
          if (refreshedUser) {
            setUser(refreshedUser);
            
            // Обновляем имя пользователя, если оно изменилось
            if (refreshedUser.displayName !== previousDisplayNameRef.current) {
              setDisplayName(refreshedUser.displayName);
              previousDisplayNameRef.current = refreshedUser.displayName;
            }
          }
        }
        
        // Проверяем сессию в Supabase
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Обновляем имя пользователя
          if (currentUser.displayName !== previousDisplayNameRef.current) {
            setDisplayName(currentUser.displayName);
            previousDisplayNameRef.current = currentUser.displayName;
          }
        } else {
          // Если сессия отсутствует, сбрасываем состояние
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
          setDisplayName('');
          previousDisplayNameRef.current = '';
        }
      } catch (error) {
        console.error('Ошибка при инициализации пользователя:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    initUser();
  }, []);

  // Синхронизация имени пользователя с любыми обновлениями user
  useEffect(() => {
    if (user && user.displayName && user.displayName !== previousDisplayNameRef.current) {
      setDisplayName(user.displayName);
      previousDisplayNameRef.current = user.displayName;
      console.log('AuthContext: Синхронизация displayName с user:', user.displayName);
    }
  }, [user]);
  
  // Функция для обновления данных текущего пользователя
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Получаем текущее отображаемое имя
      const currentUIDisplayName = manuallySetDisplayName || user.displayName;
      const currentTime = Date.now();
      
      console.log("refreshUser: Текущее имя в UI:", currentUIDisplayName);
      console.log("refreshUser: Прошло с последнего UI обновления:", currentTime - lastUIDisplayNameUpdateTime, "мс");
      
      // Проверяем, не заблокирован ли пользователь
      const banStatus = await authService.checkUserBan(user.id);
      if (banStatus.is_banned) {
        setBanInfo(banStatus);
        await authService.logout();
        setUser(null);
        setLoading(false);
        setDisplayName('');
        previousDisplayNameRef.current = '';
        manuallySetDisplayName = null;
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
      
      console.log("Получены данные профиля для обновления:", profileData);
      
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
      
      // Определяем, какое имя использовать
      let finalDisplayName;
      const dbDisplayName = profileData.display_name;
      
      // Если имя было обновлено через UI менее 10 секунд назад, приоритет за ним
      const isRecentUIUpdate = (currentTime - lastUIDisplayNameUpdateTime) < 10000;
      
      if (manuallySetDisplayName && isRecentUIUpdate) {
        // Используем имя, установленное через UI
        console.log("refreshUser: Используем недавно установленное имя из UI:", manuallySetDisplayName);
        finalDisplayName = manuallySetDisplayName;
      } else {
        // Иначе берем имя из базы данных
        console.log("refreshUser: Используем имя из базы данных:", dbDisplayName);
        finalDisplayName = dbDisplayName;
        // Сбрасываем вручную установленное имя
        manuallySetDisplayName = null;
      }
      
      if (finalDisplayName !== previousDisplayNameRef.current) {
        setDisplayName(finalDisplayName);
        previousDisplayNameRef.current = finalDisplayName;
        console.log('AuthContext: Обновление displayName:', finalDisplayName);
      }
      
      // Обновляем пользователя
      const updatedUser = {
        ...user,
        displayName: finalDisplayName,
        avatar: profileData.avatar || user.avatar,
        perks: profileData.perks,
        activePerk: profileData.active_perk
      };
      
      // Обновляем данные в localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Вызываем глобальное событие для синхронизации всех компонентов
      console.log("Обновляем пользователя через refreshUser:", updatedUser);
      triggerUserUpdate(updatedUser);
      
      // Обновляем состояние
      setUser(updatedUser);
      
      // Генерируем локальное событие storage для имитации изменения localStorage
      if (typeof window !== 'undefined') {
        const storageEvent = new StorageEvent('storage', {
          key: 'user',
          newValue: JSON.stringify(updatedUser),
          url: window.location.href
        });
        window.dispatchEvent(storageEvent);
      }
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
        throw new Error(translateAuthError(authError.message));
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
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      // Translate error if it's a string message
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
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
      
      console.log('Получен ответ от authService.register:', response);
      
      // Проверяем сессию Supabase напрямую
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Текущая сессия Supabase:', sessionData);
      
      // Автоматически устанавливаем пользователя после регистрации
      if (response && response.user) {
        // Полностью инициализируем пользователя
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Вызываем глобальное событие для синхронизации всех компонентов
        triggerUserUpdate(response.user);
        
        // Обновляем данные пользователя из базы данных для получения всех настроек
        await refreshUser();
        
        // Еще одна проверка сессии после refreshUser
        const { data: afterRefreshSession } = await supabase.auth.getSession();
        console.log('Сессия после refreshUser:', afterRefreshSession);
        
        // Проверка доступа к профилю
        const { data: profileCheck, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, perks')
          .eq('id', response.user.id)
          .single();
          
        console.log('Проверка профиля:', profileCheck, profileError);
        
        console.log('Register: Пользователь зарегистрирован и данные синхронизированы');
      }
      
      return response;
    } catch (error) {
      console.error('Ошибка при регистрации в AuthContext:', error);
      // Translate error if it's a string message
      if (error.message) {
        error.message = translateAuthError(error.message);
      }
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
      setIsAuthenticated(false);
      
      // Определяем базовый путь в зависимости от окружения
      const basePath = import.meta.env.DEV ? '/' : '/soulcycle/';
      window.location.href = basePath;
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

  // После обновления аватара в профиле
  const updateUserAvatar = async (avatarUrl) => {
    if (!user) return;
    
    try {
      // Обновляем локальное состояние
      const updatedUser = {
        ...user,
        avatar: avatarUrl
      };
      
      // Обновляем localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Устанавливаем новое состояние
      setUser(updatedUser);
      
      // Оповещаем все компоненты через событие для синхронизации UI
      const event = new CustomEvent(USER_UPDATED_EVENT, { detail: updatedUser });
      window.dispatchEvent(event);
      
      // Также используем событие storage для оповещения других вкладок
      const storageEvent = new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(updatedUser),
        url: window.location.href
      });
      window.dispatchEvent(storageEvent);
      
      return updatedUser;
    } catch (error) {
      console.error('Ошибка при обновлении аватара пользователя:', error);
      return null;
    }
  };

  // Обновляем функцию updateUserDisplayName для мгновенного обновления имени
  const updateUserDisplayName = (newDisplayName) => {
    if (!user) return false;
    
    // Немедленно обновляем имя в UI
    setDisplayName(newDisplayName);
    previousDisplayNameRef.current = newDisplayName;
    
    // Запоминаем вручную установленное имя
    manuallySetDisplayName = newDisplayName;
    // Обновляем время последнего UI обновления
    lastUIDisplayNameUpdateTime = Date.now();
    
    console.log(`AuthContext: Установлено новое имя через UI: ${newDisplayName}, время: ${lastUIDisplayNameUpdateTime}`);
    
    // Обновляем локальное состояние пользователя
    const updatedUser = {
      ...user,
      displayName: newDisplayName
    };
    
    // Обновляем данные в localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Обновляем глобальное состояние
    setUser(updatedUser);
    
    console.log('AuthContext: Мгновенное обновление имени пользователя:', newDisplayName);
    return true;
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
        isAuthenticated,
        checkUserBan: authService.checkUserBan,
        banInfo,
        closeBanModal,
        updateUserAvatar,
        updateUserDisplayName
      }}
    >
      <UserDisplayNameContext.Provider value={{ displayName, setDisplayName }}>
        {children}
        
        {/* Модальное окно с информацией о блокировке */}
        {banInfo && <BanModal banInfo={banInfo} onClose={closeBanModal} />}
      </UserDisplayNameContext.Provider>
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

// Хук для доступа к имени пользователя
export const useUserDisplayName = () => {
  const context = useContext(UserDisplayNameContext);
  if (context === undefined) {
    throw new Error('useUserDisplayName должен использоваться внутри AuthProvider');
  }
  return context;
};

export default AuthContext; 