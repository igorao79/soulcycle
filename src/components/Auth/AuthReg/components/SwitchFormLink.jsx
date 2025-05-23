import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../AuthForms.module.scss';

/**
 * Компонент для переключения между формами авторизации и регистрации
 */
const SwitchFormLink = ({ 
  message = 'Уже есть аккаунт?', 
  buttonText = 'Войти', 
  onClick, 
  disabled = false
}) => {
  return (
    <div className={styles.switchForm}>
      <p>{message}</p>
      <motion.button 
        className={styles.switchButton}
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonText}
      </motion.button>
    </div>
  );
};

export default SwitchFormLink; 