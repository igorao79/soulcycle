import { useState, useEffect, useCallback, useReducer } from 'react';
import { useAuth, useUserDisplayName } from '../../../../contexts/AuthContext';
import { USER_UPDATED_EVENT } from '../../../../contexts/AuthContext';
import userProfileService, { addListener, removeListener } from '../../../../services/userProfileService';

// Функция для получения класса перка
export const getPerkClass = (perkName, perkStyles) => {
  if (!perkName) return '';
  
  switch (perkName) {
    case 'sponsor':
      return perkStyles.sponsorPerk;
    case 'early_user':
      return perkStyles.earlyUserPerk;
    case 'admin':
      return perkStyles.adminPerk;
    default:
      return perkStyles.userPerk;
  }
};

// Переменные для отслеживания аватара
let lastUpdatedAvatar = null;
let lastAvatarUpdateTime = 0;

/**
 * Хук для управления состоянием кнопки авторизации
 * @param {Object} perkStyles - Стили для перков
 */
export const useAuthButtonState = (perkStyles) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { displayName } = useUserDisplayName();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePerkClass, setActivePerkClass] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  
  // Для принудительного обновления компонента
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Функция определения класса перка (мемоизированная)
  const getActivePerkClass = useCallback((perkName) => {
    return getPerkClass(perkName, perkStyles);
  }, [perkStyles]);
  
  // Обновление статуса администратора и активного перка
  useEffect(() => {
    if (user) {
      const isUserAdmin = user.email === 'igoraor79@gmail.com' || 
                          user.perks?.includes('admin') || 
                          user.activePerk === 'admin';
      setIsAdmin(isUserAdmin);
      setActivePerkClass(getActivePerkClass(user.activePerk));
      
      if (user.avatar && user.avatar !== currentAvatar) {
        setCurrentAvatar(user.avatar);
      }
      
      console.log('AuthButton: Перк пользователя обновлен', {
        activePerk: user.activePerk,
        perks: user.perks,
        perkClass: getActivePerkClass(user.activePerk)
      });
    } else {
      setActivePerkClass('');
      setCurrentAvatar(null);
    }
  }, [user, getActivePerkClass, currentAvatar]);
  
  // Проверка localStorage для обновления аватара - ТОЛЬКО при изменениях
  useEffect(() => {
    const checkLocalStorageAvatar = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData.avatar && userData.avatar !== currentAvatar) {
            console.log('AuthButton: Обнаружен новый аватар в localStorage:', userData.avatar);
            setCurrentAvatar(userData.avatar);
            setAvatarKey(Date.now());
          }
        }
      } catch (error) {
        console.error('Ошибка при чтении аватара из localStorage:', error);
      }
    };
    
    // Проверяем только при монтировании - убираем излишние интервалы
    checkLocalStorageAvatar();
  }, [currentAvatar]); // Зависимость только от currentAvatar
  
  // Подписка на события обновления пользователя
  useEffect(() => {
    const handleUserUpdate = (event) => {
      const updatedUser = event.detail;
      if (updatedUser) {
        console.log('AuthButton: Получено событие обновления пользователя', updatedUser);
        
        if (updatedUser.avatar && (user?.avatar !== updatedUser.avatar || currentAvatar !== updatedUser.avatar)) {
          console.log('AuthButton: Обнаружено изменение аватара через событие:', updatedUser.avatar);
          setCurrentAvatar(updatedUser.avatar);
          setAvatarKey(Date.now());
          
          lastUpdatedAvatar = updatedUser.avatar;
          lastAvatarUpdateTime = Date.now();
        }
        
        const isUserAdmin = updatedUser.email === 'igoraor79@gmail.com' || 
                           updatedUser.perks?.includes('admin') || 
                           updatedUser.activePerk === 'admin';
        setIsAdmin(isUserAdmin);
        setActivePerkClass(getActivePerkClass(updatedUser.activePerk));
        forceUpdate();
      }
    };
    
    const handleAuthRefresh = () => {
      console.log('AuthButton: Получено событие auth:refresh, обновляем интерфейс');
      forceUpdate();
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          console.log('AuthButton: Данные из localStorage после auth:refresh:', userData);
          
          const isUserAdmin = userData.email === 'igoraor79@gmail.com' || 
                            userData.perks?.includes('admin') || 
                            userData.activePerk === 'admin';
          setIsAdmin(isUserAdmin);
          setActivePerkClass(getActivePerkClass(userData.activePerk));
          
          if (userData.avatar && currentAvatar !== userData.avatar) {
            setCurrentAvatar(userData.avatar);
            setAvatarKey(Date.now());
          }
        }
      } catch (error) {
        console.error('AuthButton: Ошибка при чтении из localStorage после auth:refresh', error);
      }
    };
    
    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdate);
    window.addEventListener('auth:refresh', handleAuthRefresh);
    
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdate);
      window.removeEventListener('auth:refresh', handleAuthRefresh);
    };
  }, [getActivePerkClass, user, currentAvatar]);
  
  // Подписка на изменения в localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const newUserData = e.newValue ? JSON.parse(e.newValue) : null;
          
          if (newUserData && newUserData.avatar && (currentAvatar !== newUserData.avatar)) {
            console.log('AuthButton: Обнаружено изменение аватара в storage:', newUserData.avatar);
            setCurrentAvatar(newUserData.avatar);
            setAvatarKey(Date.now());
            
            lastUpdatedAvatar = newUserData.avatar;
            lastAvatarUpdateTime = Date.now();
          }
          
          forceUpdate();
        } catch (error) {
          console.error('Ошибка при обработке изменений localStorage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentAvatar]);

  // Подписка на события profileUpdated
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const { userId, profileData } = e.detail || {};
      
      if (user && userId === user.id && profileData) {
        console.log('AuthButton: Получено событие profileUpdated', profileData);
        
        if (profileData.avatar && currentAvatar !== profileData.avatar) {
          console.log('AuthButton: Обновляем аватар из события profileUpdated:', profileData.avatar);
          setCurrentAvatar(profileData.avatar);
          setAvatarKey(Date.now());
          
          lastUpdatedAvatar = profileData.avatar;
          lastAvatarUpdateTime = Date.now();
        }
      }
    };
    
    const unsubscribe = addListener('profileUpdated', handleProfileUpdate);
    return () => {
      unsubscribe();
    };
  }, [user, currentAvatar]);

  // Обработчики событий
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  return {
    user,
    displayName,
    isAuthenticated,
    isAdmin,
    isModalOpen,
    userMenuOpen,
    currentAvatar,
    avatarKey,
    activePerkClass,
    handleOpenModal,
    handleCloseModal,
    handleLogout,
    toggleUserMenu,
    setUserMenuOpen
  };
}; 