import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../AuthForms.module.scss';

/**
 * Компонент для перехода на форму восстановления пароля
 */
const ForgotPasswordLink = ({ 
  disabled = false,
  buttonText = 'Забыли пароль?'
}) => {
  const [showMessage, setShowMessage] = useState(false);
  
  const handleClick = () => {
    setShowMessage(true);
    // Автоматически скрываем сообщение через 3 секунды
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };
  
  return (
    <div className={styles.forgotPassword}>
      <motion.button
        className={styles.switchButton}
        onClick={handleClick}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonText}
      </motion.button>
      
      <AnimatePresence>
        {showMessage && (
          <motion.div 
            className={styles.devMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            В разработке
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPasswordLink; 