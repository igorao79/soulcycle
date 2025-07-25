import React, { useContext, useState, useEffect } from 'react';
import styles from './AuthButton.module.scss';
import perkStyles from '../../../styles/Perks.module.scss';
import AuthModal from '../AuthModal';
import { ThemeContext } from '../../theme/ThemeContext';
import { useAuthButtonState } from './hooks/useAuthButtonState';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';

// Импортируем подкомпоненты
import LoginButton from './components/LoginButton';
import UserProfileButton from './components/UserProfileButton';
import UserMenu from './components/UserMenu';

/**
 * Компонент кнопки авторизации и меню пользователя
 */
const AuthButton = () => {
  const { theme } = useContext(ThemeContext);
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  
  const {
    displayName,
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
  } = useAuthButtonState(perkStyles);

  const [showLoader, setShowLoader] = useState(false); // Отключаем автоматический лоадер

  // Показываем лоадер только если реально идет загрузка авторизации
  if (authLoading) {
    return (
      <div className={styles.profileButton}>
        <div className={styles.loader}>
          <div className={styles.loaderSpinner}></div>
          <span className={styles.loaderText}>Проверка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      {isAuthenticated ? (
        <div className={styles.userProfile}>
          {/* Кнопка профиля пользователя */}
          <UserProfileButton 
            onClick={toggleUserMenu}
            avatar={currentAvatar || user?.avatar}
            displayName={displayName}
            activePerkClass={activePerkClass}
            isMenuOpen={userMenuOpen}
            avatarKey={avatarKey}
          />
          
          {/* Выпадающее меню пользователя */}
          <UserMenu 
            isOpen={userMenuOpen}
            isAdmin={isAdmin}
            onLogout={handleLogout}
            onMenuClose={() => setUserMenuOpen(false)}
          />
        </div>
      ) : (
        /* Кнопка входа */
        <LoginButton onClick={handleOpenModal} />
      )}

      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default AuthButton; 