import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { buttonVariants, arrowVariants } from '../config/animations';
import OptimizedAvatar from '../../../shared/OptimizedAvatar';
import styles from '../AuthButton.module.scss';

/**
 * Компонент кнопки профиля пользователя, показывающий аватар и имя
 */
const UserProfileButton = ({ 
  onClick, 
  avatar, 
  displayName, 
  activePerkClass, 
  isMenuOpen,
  avatarKey
}) => {
  return (
    <motion.button 
      className={styles.profileButton} 
      onClick={onClick}
      aria-label="Меню пользователя"
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      key={`profile-button-${avatarKey}`}
    >
      <OptimizedAvatar 
        src={avatar} 
        alt="Аватар пользователя" 
        className={styles.avatar}
        key={`avatar-${avatarKey}`}
      />
      <span className={`${styles.username} ${activePerkClass}`}>
        {displayName}
      </span>
      <motion.span
        animate={isMenuOpen ? "open" : "closed"}
        variants={arrowVariants}
        transition={{ duration: 0.3 }}
        style={{ marginLeft: '3px', display: 'flex', alignItems: 'center' }}
      >
        <FiChevronDown size={14} />
      </motion.span>
    </motion.button>
  );
};

export default UserProfileButton; 