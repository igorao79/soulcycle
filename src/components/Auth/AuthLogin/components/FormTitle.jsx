import React from 'react';
import { motion } from 'framer-motion';
import { titleVariants } from '../config/animations';
import styles from '../../AuthForms.module.scss';

/**
 * Компонент заголовка формы с анимацией
 */
const FormTitle = ({ children }) => {
  return (
    <motion.h2 
      className={styles.formTitle}
      variants={titleVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.h2>
  );
};

export default FormTitle; 