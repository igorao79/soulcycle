import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './AuthButton.module.scss';
import AuthModal from './AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { USER_UPDATED_EVENT } from '../../contexts/AuthContext';
import { FiLogIn, FiUser, FiSettings, FiLogOut, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import perkStyles from '../../styles/Perks.module.scss';
import OptimizedAvatar from '../shared/OptimizedAvatar';
import userProfileService from '../../services/userProfileService';

const AuthButton = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState('Пользователь');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePerkClass, setActivePerkClass] = useState('');
  
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
  
  // Обновляем отображаемое имя и активный перк при изменении пользователя
  useEffect(() => {
    if (user) {
      // Обновляем отображаемое имя
      setDisplayName(user.displayName || 'Пользователь');
      
      // Проверяем, является ли пользователь администратором
      const isUserAdmin = user.email === 'igoraor79@gmail.com' || 
                          user.perks?.includes('admin') || 
                          user.activePerk === 'admin';
      setIsAdmin(isUserAdmin);
      
      // Устанавливаем класс стиля на основе активной привилегии
      setActivePerkClass(getPerkClass(user.activePerk));
      
      // Выводим дебаг информацию
      console.log('AuthButton: Перк пользователя обновлен', {
        activePerk: user.activePerk,
        perks: user.perks,
        perkClass: getPerkClass(user.activePerk)
      });
    } else {
      setActivePerkClass('');
    }
  }, [user, getPerkClass]);
  
  // Подписываемся на глобальное событие обновления пользователя
  useEffect(() => {
    const handleUserUpdate = (event) => {
      const updatedUser = event.detail;
      if (updatedUser) {
        console.log('AuthButton: Получено событие обновления пользователя', updatedUser);
        forceUpdate();
        
        // Проверяем, изменился ли аватар
        if (user && user.avatar !== updatedUser.avatar) {
          setAvatarKey(Date.now()); // Увеличиваем ключ для принудительного обновления аватара
        }
        
        // Обновляем статус администратора
        const isUserAdmin = updatedUser.email === 'igoraor79@gmail.com' || 
                           updatedUser.perks?.includes('admin') || 
                           updatedUser.activePerk === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Обновляем отображаемое имя
        setDisplayName(updatedUser.displayName || 'Пользователь');
        
        // Устанавливаем класс стиля перка
        setActivePerkClass(getPerkClass(updatedUser.activePerk));
      }
    };
    
    // Добавляем слушатель событий
    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdate);
    
    // Удаляем слушатель при размонтировании
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdate);
    };
  }, [getPerkClass]);
  
  // Подписываемся на изменения в localStorage для мгновенного обновления
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          // Если данные пользователя изменились
          const newUserData = e.newValue ? JSON.parse(e.newValue) : null;
          const oldUserData = user;
          
          // Проверяем изменение аватара (даже в той же вкладке)
          if (newUserData && oldUserData && newUserData.avatar !== oldUserData.avatar) {
            console.log('AuthButton: Обнаружено изменение аватара:', newUserData.avatar);
            setAvatarKey(Date.now()); // Устанавливаем новый ключ для обновления
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
  }, [user]);

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
              src={user?.avatar} 
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