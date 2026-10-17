import React, { useRef } from 'react';
import styles from './AuthButton.module.scss';
import perkStyles from '../../../styles/Perks.module.scss';
import AuthModal from '../AuthModal';
import { useAuthButtonState } from './hooks/useAuthButtonState';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';

// Импортируем подкомпоненты
import LoginButton from './components/LoginButton';
import UserProfileButton from './components/UserProfileButton';
import UserMenu from './components/UserMenu';

/**
 * Компонент кнопки авторизации и меню пользователя
 */
const AuthButton = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
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

  const profileBtnRef = useRef(null);

  // Пока идёт проверка авторизации, показываем заглушку размера кнопки профиля — без скачка вёрстки
  if (authLoading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authSkeleton} aria-busy="true" aria-label="Проверка авторизации" />
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
            ref={profileBtnRef}
          />
          
          {/* Выпадающее меню пользователя */}
          <UserMenu 
            isOpen={userMenuOpen}
            isAdmin={isAdmin}
            onLogout={handleLogout}
            onMenuClose={() => setUserMenuOpen(false)}
            anchorRef={profileBtnRef}
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