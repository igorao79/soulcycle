import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import styles from './AuthForms.module.scss';
import InputMask from 'react-input-mask';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }
    
    if (password.length > 15) {
      setError('Пароль не должен превышать 15 символов');
      return;
    }
    
    if (displayName.length > 12) {
      setError('Имя пользователя не должно превышать 12 символов');
      return;
    }
    
    try {
      setError(''); // Reset error before submission
      
      // Register user through context
      await register({
        email,
        password,
        displayName
      });
      
      // After successful registration, switch to login form
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError(err.message || 'Ошибка при регистрации. Попробуйте позже.');
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

  // Form fields container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Individual field animation
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  // Handle input change for display name with max length validation
  const handleDisplayNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 12) {
      setDisplayName(value);
    }
  };
  
  // Handle input change for password with max length validation
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (value.length <= 15) {
      setPassword(value);
    }
  };
  
  // Handle input change for confirm password with max length validation
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    if (value.length <= 15) {
      setConfirmPassword(value);
    }
  };

  return (
    <div className={styles.formContainer}>
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Регистрация
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
      
      <motion.form 
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.formGroup} variants={fieldVariants}>
          <label htmlFor="displayName">
            <FiUser className={styles.inputIcon} /> Имя пользователя:
          </label>
          <motion.div
            whileFocus="focus"
            whileTap="focus" 
            variants={inputVariants}
          >
            <div className={styles.inputWrapper}>
              <FiUser className={styles.inputIconInside} />
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={handleDisplayNameChange}
                disabled={loading}
                placeholder="Введите ваше имя (до 12 символов)"
                required
                maxLength={12}
              />
            </div>
          </motion.div>
          <small className={styles.charCounter}>
            {displayName.length}/12 символов
          </small>
        </motion.div>
        
        <motion.div className={styles.formGroup} variants={fieldVariants}>
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
        </motion.div>
        
        <motion.div className={styles.formGroup} variants={fieldVariants}>
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
                onChange={handlePasswordChange}
                disabled={loading}
                placeholder="От 6 до 15 символов"
                required
                maxLength={15}
              />
            </div>
          </motion.div>
          <small className={styles.charCounter}>
            {password.length}/15 символов
          </small>
        </motion.div>
        
        <motion.div className={styles.formGroup} variants={fieldVariants}>
          <label htmlFor="confirmPassword">
            <FiLock className={styles.inputIcon} /> Подтвердите пароль:
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
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={loading}
                placeholder="Повторите пароль"
                required
                maxLength={15}
              />
            </div>
          </motion.div>
        </motion.div>
        
        <motion.button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {loading ? 'Регистрация...' : (
            <>
              <FiUserPlus className={styles.buttonIcon} />
              <span>Зарегистрироваться</span>
            </>
          )}
        </motion.button>
      </motion.form>
      
      <div className={styles.switchForm}>
        <p>Уже есть аккаунт?</p>
        <motion.button 
          className={styles.switchButton}
          onClick={onSwitchToLogin}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Войти
        </motion.button>
      </div>
    </div>
  );
};

export default RegisterForm; 