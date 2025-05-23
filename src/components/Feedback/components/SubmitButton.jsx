import React from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import { buttonVariants } from '../config/animations';
import styles from '../FeedbackForm.module.scss';

/**
 * Компонент кнопки отправки формы
 */
const SubmitButton = ({ sending, disabled }) => {
  return (
    <motion.button 
      type="submit" 
      className={styles.submitButton}
      disabled={disabled}
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
    >
      {sending ? 'Отправка...' : (
        <>
          <FiSend className={styles.buttonIcon} />
          <span>Отправить</span>
        </>
      )}
    </motion.button>
  );
};

export default SubmitButton; 