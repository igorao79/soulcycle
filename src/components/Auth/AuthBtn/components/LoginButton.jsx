import React from 'react';
import { motion } from 'framer-motion';
import { FiLogIn } from 'react-icons/fi';
import { buttonVariants } from '../config/animations';
import styles from '../AuthButton.module.scss';

/**
 * Компонент кнопки входа в систему
 */
const LoginButton = ({ onClick }) => {
  return (
    <motion.button 
      className={styles.loginButton}
      onClick={onClick}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
    >
      <FiLogIn size={16} /> Войти
    </motion.button>
  );
};

export default LoginButton; 