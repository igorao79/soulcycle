import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthForms.module.scss';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import InputMask from 'react-input-mask';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      setError(''); // Reset error before submission
      
      // Login through auth context
      await login({ email, password });
      
      // If successful, trigger success handler
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Handle authentication error
      console.error('Ошибка входа:', err);
      setError(err.message || 'Ошибка входа. Проверьте ваши учетные данные.');
    }
  };

  // Input field animation
  const inputVariants = {
    focus: { scale: 1.02, x: 5 },
    blur: { scale: 1, x: 0 }
  };

  // Button animation
  const buttonVariants = {
    hover: { 
      scale: 1.03,
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)" 
    },
    tap: { 
      scale: 0.98
    }
  };

  return (
    <div className={styles.formContainer}>
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Вход в аккаунт
      </motion.h2>
      
      {error && (
        <motion.div 
          className={styles.errorMessage}
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          {error}
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email">
            <FiMail className={styles.inputIcon} /> Email:
          </label>
          <motion.div
            whileFocus="focus"
            whileTap="focus" 
            variants={inputVariants}
          >
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIconInside} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="Введите ваш email"
                required
              />
            </div>
          </motion.div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password">
            <FiLock className={styles.inputIcon} /> Пароль:
          </label>
          <motion.div
            whileFocus="focus"
            whileTap="focus" 
            variants={inputVariants}
          >
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIconInside} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Введите ваш пароль"
                required
              />
            </div>
          </motion.div>
        </div>
        
        <motion.button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {loading ? 'Вход...' : (
            <>
              <FiLogIn className={styles.buttonIcon} />
              <span>Войти</span>
            </>
          )}
        </motion.button>
      </form>
      
      <div className={styles.switchForm}>
        <p>Еще нет аккаунта?</p>
        <motion.button 
          className={styles.switchButton}
          onClick={onSwitchToRegister}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Зарегистрироваться
        </motion.button>
      </div>
    </div>
  );
};

export default LoginForm; 