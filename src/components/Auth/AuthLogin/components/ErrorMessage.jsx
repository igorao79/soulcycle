import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { errorVariants } from '../config/animations';
import styles from '../../AuthForms.module.scss';

/**
 * Компонент для отображения сообщения об ошибке с анимацией
 */
const ErrorMessage = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          className={styles.errorMessage}
          variants={errorVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorMessage; 