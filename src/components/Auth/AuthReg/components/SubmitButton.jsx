import React from 'react';
import { motion } from 'framer-motion';
import { buttonVariants } from '../config/animations';
import styles from '../../AuthForms.module.scss';

/**
 * Компонент кнопки отправки формы с анимацией
 */
const SubmitButton = ({ 
  loading, 
  icon: Icon, 
  loadingText = 'Загрузка...', 
  children
}) => {
  return (
    <motion.button 
      type="submit" 
      className={styles.submitButton}
      disabled={loading}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
    >
      {loading ? loadingText : (
        <>
          {Icon && <Icon className={styles.buttonIcon} />}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};

export default SubmitButton; 