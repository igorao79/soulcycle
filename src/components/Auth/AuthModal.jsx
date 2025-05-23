import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import styles from './AuthModal.module.scss';
// import LoginForm from './LoginForm';
import LoginForm from './AuthLogin/LoginForm';
// import RegisterForm from './RegisterForm';
import RegisterForm from './AuthReg/RegisterForm';
import ResetPassword from './ResetPassword';
import { useAuth } from '../../contexts/AuthContext';

// Модальное окно для авторизации, отображается через портал
const AuthModal = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const [activeForm, setActiveForm] = useState('login');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Для отладки
  console.log('AuthModal render, isOpen:', isOpen);
  
  useEffect(() => {
    if (isOpen) {
      console.log('AuthModal: открываем модальное окно');
      document.body.style.overflow = 'hidden';
      // Запускаем анимацию после открытия модального окна
      setTimeout(() => setShouldAnimate(true), 100);
    } else {
      document.body.style.overflow = 'unset';
      setShouldAnimate(false);
    }
    
    // Сбрасываем активную форму при закрытии
    if (!isOpen) {
      setTimeout(() => setActiveForm('login'), 300);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Обработчик закрытия при успешной авторизации
  const handleSuccess = () => {
    setTimeout(() => {
      onClose();
    }, 500);
  };
  
  // Обработчик переключения на форму логина 
  const switchToLogin = () => {
    setActiveForm('login');
  };
  
  // Обработчик переключения на форму регистрации
  const switchToRegister = () => {
    setActiveForm('register');
  };
  
  // Обработчик переключения на форму сброса пароля
  const switchToReset = () => {
    setActiveForm('reset');
  };
  
  // Обработчик закрытия модального окна
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };
  
  // Анимация появления/исчезновения модального окна
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        duration: 0.5,
        bounce: 0.4
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.3 }
    }
  };
  
  // Создаем содержимое модального окна
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.backdrop}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div 
            className={styles.modal}
            variants={modalVariants}
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.closeButton} onClick={handleClose}>
              <FiX />
            </button>
            
            <div className={styles.modalContent}>
              {activeForm === 'login' && (
                <LoginForm 
                  onSuccess={handleSuccess} 
                  onSwitchToRegister={switchToRegister}
                />
              )}
              
              {activeForm === 'register' && (
                <RegisterForm 
                  onSuccess={handleSuccess} 
                  onSwitchToLogin={switchToLogin}
                />
              )}
              
              {activeForm === 'reset' && (
                <ResetPassword 
                  onSwitchToLogin={switchToLogin}
                />
              )}
            </div>
            
            <div className={styles.patternOverlay} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  // Если модальное окно закрыто, не рендерим портал
  if (!isOpen) return null;
  
  // Рендерим через портал
  return createPortal(modalContent, document.body);
};

export default AuthModal;