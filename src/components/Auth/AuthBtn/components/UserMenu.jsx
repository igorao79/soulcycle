import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiSettings, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { menuVariants } from '../config/animations';
import UserMenuItem from './UserMenuItem';
import styles from '../AuthButton.module.scss';

/**
 * Компонент выпадающего меню пользователя
 */
const UserMenu = ({ 
  isOpen, 
  isAdmin, 
  onLogout, 
  onMenuClose 
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
    onMenuClose();
  };

  const handleAdminClick = () => {
    navigate('/admin');
    onMenuClose();
  };

  const handleFeedbackClick = () => {
    navigate('/feedback');
    onMenuClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.userMenu}
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ul>
            <UserMenuItem 
              icon={FiUser} 
              label="Профиль" 
              onClick={handleProfileClick}
              className={styles.profileMenuItem}
            />
            
            <UserMenuItem 
              icon={FiMessageSquare} 
              label="Обратная связь" 
              onClick={handleFeedbackClick}
              className={styles.feedbackButton}
            />
            
            {isAdmin && (
              <UserMenuItem 
                icon={FiSettings} 
                label="Администрирование" 
                onClick={handleAdminClick}
                className={styles.adminButton}
              />
            )}
            
            <UserMenuItem 
              icon={FiLogOut} 
              label="Выйти" 
              onClick={onLogout}
              className={styles.logoutButton}
            />
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserMenu; 