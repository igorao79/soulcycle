import React, { useState, useEffect, useCallback, useReducer, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './AuthButton.module.scss';
import AuthModal from './AuthModal';
import { useAuth, useUserDisplayName } from '../../contexts/AuthContext';
import { USER_UPDATED_EVENT } from '../../contexts/AuthContext';
import { FiLogIn, FiUser, FiSettings, FiLogOut, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import perkStyles from '../../styles/Perks.module.scss';
import OptimizedAvatar from '../shared/OptimizedAvatar';
import userProfileService, { addListener, removeListener } from '../../services/userProfileService';
import { ThemeContext } from '../theme/ThemeContext';

// Переменная для отслеживания последнего установленного аватара
let lastUpdatedAvatar = null;
let lastAvatarUpdateTime = 0;

const AuthButton = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { displayName } = useUserDisplayName(); // Используем новый контекст для имени
  const { theme } = useContext(ThemeContext); // Get the current theme
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePerkClass, setActivePerkClass] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState(null);
  
  // Добавляем forceUpdate для обновления компонента при изменениях пользователя
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [avatarKey, setAvatarKey] = useState(Date.now());  // Добавляем ключ для принудительного обновления аватара
  
  // Функция определения класса перка (вынесена для переиспользования)
  const getPerkClass = useCallback((perkName) => {
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
  }, []);
  
  // Обновляем статус администратора и активный перк при изменении пользователя
  useEffect(() => {
    if (user) {
      // Проверяем, является ли пользователь администратором
      const isUserAdmin = user.email === 'igoraor79@gmail.com' || 
                          user.perks?.includes('admin') || 
                          user.activePerk === 'admin';
      setIsAdmin(isUserAdmin);
      
      // Устанавливаем класс стиля на основе активной привилегии
      setActivePerkClass(getPerkClass(user.activePerk));
      
      // Обновляем текущий аватар
      if (user.avatar && user.avatar !== currentAvatar) {
        setCurrentAvatar(user.avatar);
      }
      
      // Выводим дебаг информацию
      console.log('AuthButton: Перк пользователя обновлен', {
        activePerk: user.activePerk,
        perks: user.perks,
        perkClass: getPerkClass(user.activePerk)
      });
    } else {
      setActivePerkClass('');
      setCurrentAvatar(null);
    }
  }, [user, getPerkClass, currentAvatar]);
  
  // Проверяем localStorage напрямую для мгновенного обновления аватара
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
    
    // Проверяем сразу при монтировании
    checkLocalStorageAvatar();
    
    // Устанавливаем интервал для периодической проверки (раз в секунду)
    const intervalId = setInterval(checkLocalStorageAvatar, 1000);
    
    return () => clearInterval(intervalId);
  }, [currentAvatar]);
  
  // Подписываемся на глобальное событие обновления пользователя
  useEffect(() => {
    const handleUserUpdate = (event) => {
      const updatedUser = event.detail;
      if (updatedUser) {
        console.log('AuthButton: Получено событие обновления пользователя', updatedUser);
        
        // Проверяем, изменился ли аватар
        if (updatedUser.avatar && (user?.avatar !== updatedUser.avatar || currentAvatar !== updatedUser.avatar)) {
          console.log('AuthButton: Обнаружено изменение аватара через событие:', updatedUser.avatar);
          setCurrentAvatar(updatedUser.avatar);
          setAvatarKey(Date.now()); // Увеличиваем ключ для принудительного обновления аватара
          
          // Запоминаем последний обновленный аватар
          lastUpdatedAvatar = updatedUser.avatar;
          lastAvatarUpdateTime = Date.now();
        }
        
        // Обновляем статус администратора
        const isUserAdmin = updatedUser.email === 'igoraor79@gmail.com' || 
                           updatedUser.perks?.includes('admin') || 
                           updatedUser.activePerk === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Устанавливаем класс стиля перка
        setActivePerkClass(getPerkClass(updatedUser.activePerk));
        
        // Форсируем обновление компонента
        forceUpdate();
      }
    };
    
    // Обработчик события auth:refresh для обновления состояния компонента
    const handleAuthRefresh = () => {
      console.log('AuthButton: Получено событие auth:refresh, обновляем интерфейс');
      forceUpdate();
      
      // Проверяем localStorage на наличие обновленных данных пользователя
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          console.log('AuthButton: Данные из localStorage после auth:refresh:', userData);
          
          // Обновляем статус администратора
          const isUserAdmin = userData.email === 'igoraor79@gmail.com' || 
                            userData.perks?.includes('admin') || 
                            userData.activePerk === 'admin';
          setIsAdmin(isUserAdmin);
          
          // Устанавливаем класс стиля перка
          setActivePerkClass(getPerkClass(userData.activePerk));
          
          // Обновляем аватар, если он изменился
          if (userData.avatar && currentAvatar !== userData.avatar) {
            setCurrentAvatar(userData.avatar);
            setAvatarKey(Date.now());
          }
        }
      } catch (error) {
        console.error('AuthButton: Ошибка при чтении из localStorage после auth:refresh', error);
      }
    };
    
    // Добавляем слушатели событий
    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdate);
    window.addEventListener('auth:refresh', handleAuthRefresh);
    
    // Удаляем слушатели при размонтировании
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdate);
      window.removeEventListener('auth:refresh', handleAuthRefresh);
    };
  }, [getPerkClass, user, currentAvatar]);
  
  // Подписываемся на изменения в localStorage для мгновенного обновления
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          // Если данные пользователя изменились
          const newUserData = e.newValue ? JSON.parse(e.newValue) : null;
          
          // Проверяем изменение аватара (даже в той же вкладке)
          if (newUserData && newUserData.avatar && (currentAvatar !== newUserData.avatar)) {
            console.log('AuthButton: Обнаружено изменение аватара в storage:', newUserData.avatar);
            setCurrentAvatar(newUserData.avatar);
            setAvatarKey(Date.now()); // Устанавливаем новый ключ для обновления
            
            // Запоминаем последний обновленный аватар
            lastUpdatedAvatar = newUserData.avatar;
            lastAvatarUpdateTime = Date.now();
          }
          
          // Принудительно обновляем компонент при изменении user в localStorage
          forceUpdate();
        } catch (error) {
          console.error('Ошибка при обработке изменений localStorage:', error);
        }
      }
    };
    
    // Добавляем слушатель событий storage
    window.addEventListener('storage', handleStorageChange);
    
    // Удаляем слушатель при размонтировании
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentAvatar]);

  // Когда происходит событие profileUpdated
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const { userId, profileData } = e.detail || {};
      
      // Проверяем, относится ли обновление к текущему пользователю
      if (user && userId === user.id && profileData) {
        console.log('AuthButton: Получено событие profileUpdated', profileData);
        
        // Проверяем, изменился ли аватар
        if (profileData.avatar && currentAvatar !== profileData.avatar) {
          console.log('AuthButton: Обновляем аватар из события profileUpdated:', profileData.avatar);
          setCurrentAvatar(profileData.avatar);
          setAvatarKey(Date.now());
          
          // Запоминаем последний обновленный аватар
          lastUpdatedAvatar = profileData.avatar;
          lastAvatarUpdateTime = Date.now();
        }
      }
    };
    
    // Добавляем слушатель событий
    const unsubscribe = addListener('profileUpdated', handleProfileUpdate);
    
    // Удаляем слушатель при размонтировании
    return () => {
      unsubscribe();
    };
  }, [user, currentAvatar]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const handleProfileClick = () => {
    // Навигация на страницу профиля
    navigate('/profile');
    setUserMenuOpen(false);
  };

  const handleAdminClick = () => {
    // Навигация на админ-панель
    navigate('/admin');
    setUserMenuOpen(false);
  };

  const handleFeedbackClick = () => {
    // Открытие формы обратной связи в новой вкладке
    navigate('/feedback');
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Эффекты для анимации
  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.3,
        staggerChildren: 0.06
      }
    },
    exit: { 
      opacity: 0, 
      y: -5,
      scale: 0.98,
      transition: {
        duration: 0.2
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -5, y: 5 },
    visible: { 
      opacity: 1, 
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.03,
      y: -2
    },
    tap: { 
      scale: 0.98
    }
  };

  return (
    <div className={styles.authContainer}>
      {isAuthenticated ? (
        <div className={styles.userProfile}>
          <motion.button 
            className={styles.profileButton} 
            onClick={toggleUserMenu}
            aria-label="Меню пользователя"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <OptimizedAvatar 
              src={currentAvatar || user?.avatar} 
              alt="Аватар пользователя" 
              className={styles.avatar}
              key={avatarKey}
            />
            <span className={`${styles.username} ${activePerkClass}`}>{displayName}</span>
            <motion.span
              animate={{ rotate: userMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginLeft: '3px', display: 'flex', alignItems: 'center' }}
            >
              <FiChevronDown size={14} />
            </motion.span>
          </motion.button>
          
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div 
                className={styles.userMenu}
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ul>
                  <motion.li variants={menuItemVariants}>
                    <motion.button 
                      className={`${styles.menuItem} ${styles.profileMenuItem}`}
                      onClick={handleProfileClick}
                      whileHover={{ x: 5 }}
                    >
                      <FiUser /> Профиль
                    </motion.button>
                  </motion.li>
                  <motion.li variants={menuItemVariants}>
                    <motion.button 
                      className={`${styles.menuItem} ${styles.feedbackButton}`}
                      onClick={handleFeedbackClick}
                      whileHover={{ x: 5 }}
                    >
                      <FiMessageSquare /> Обратная связь
                    </motion.button>
                  </motion.li>
                  {isAdmin && (
                    <motion.li variants={menuItemVariants}>
                      <motion.button 
                        className={`${styles.menuItem} ${styles.adminButton}`}
                        onClick={handleAdminClick}
                        whileHover={{ x: 5 }}
                      >
                        <FiSettings /> Администрирование
                      </motion.button>
                    </motion.li>
                  )}
                  <motion.li variants={menuItemVariants}>
                    <motion.button 
                      className={`${styles.menuItem} ${styles.logoutButton}`}
                      onClick={handleLogout}
                      whileHover={{ x: 5 }}
                    >
                      <FiLogOut /> Выйти
                    </motion.button>
                  </motion.li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.button 
          className={styles.loginButton}
          onClick={handleOpenModal}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <FiLogIn size={16} /> Войти
        </motion.button>
      )}

      <AuthModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default AuthButton; 