import React from 'react';
import { motion } from 'framer-motion';
import { menuItemVariants } from '../config/animations';
import styles from '../AuthButton.module.scss';

/**
 * Компонент пункта меню пользователя
 */
const UserMenuItem = ({ onClick, icon: Icon, label, className = '' }) => {
  return (
    <motion.li variants={menuItemVariants}>
      <motion.button 
        className={`${styles.menuItem} ${className}`}
        onClick={onClick}
        whileHover={{ x: 5 }}
      >
        {Icon && <Icon />} {label}
      </motion.button>
    </motion.li>
  );
};

export default UserMenuItem; 