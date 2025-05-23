import React from 'react';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import { itemVariants } from '../config/animations';
import styles from '../FeedbackForm.module.scss';

/**
 * Компонент для отображения поля с электронной почтой пользователя
 */
const EmailField = ({ email }) => {
  return (
    <motion.div 
      className={styles.formGroup}
      variants={itemVariants}
      layout
    >
      <label>
        <FiMail className={styles.inputIcon} /> Email:
      </label>
      <div className={styles.inputWrapper}>
        <FiMail className={styles.inputIconInside} />
        <input
          type="email"
          value={email || 'Пожалуйста, войдите в аккаунт'}
          disabled={true}
          readOnly
          className={styles.disabledInput}
        />
      </div>
    </motion.div>
  );
};

export default EmailField; 