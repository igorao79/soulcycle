import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '../config/animations';
import styles from '../FeedbackForm.module.scss';

/**
 * Компонент для ввода текста сообщения
 */
const MessageField = ({ value, onChange, disabled }) => {
  return (
    <motion.div 
      className={styles.formGroup}
      variants={itemVariants}
      layout
    >
      <label>Суть запроса:</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Опишите ваш запрос или предложение детально..."
        rows={6}
        className={styles.textarea}
        required
      />
    </motion.div>
  );
};

export default MessageField; 