import React, { useContext } from 'react';
import styles from './AuthButton.module.scss';
import perkStyles from '../../../styles/Perks.module.scss';
import AuthModal from '../AuthModal';
import { ThemeContext } from '../../theme/ThemeContext';
import { useAuthButtonState } from './hooks/useAuthButtonState';

// Импортируем подкомпоненты
import LoginButton from './components/LoginButton';
import UserProfileButton from './components/UserProfileButton';
import UserMenu from './components/UserMenu';

/**
 * Компонент кнопки авторизации и меню пользователя
 */
const AuthButton = () => {
  const { theme } = useContext(ThemeContext);
  
  const {
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
  } = useAuthButtonState(perkStyles);

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