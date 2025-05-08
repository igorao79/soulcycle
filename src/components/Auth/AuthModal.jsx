import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import styles from './AuthModal.module.scss';
import { FiX } from 'react-icons/fi';

const AuthModal = ({ isOpen, onClose }) => {
  const [activeForm, setActiveForm] = useState('login'); // 'login' or 'register'
  
  // Prevent scroll and maintain position
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflow = 'auto';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  const handleSwitchToRegister = () => {
    setActiveForm('register');
  };
  
  const handleSwitchToLogin = () => {
    setActiveForm('login');
  };
  
  const handleSuccess = () => {
    onClose();
  };
  
  // If modal is closed, render nothing
  if (!isOpen) return null;
  
  // Animation variants for modal
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: -50,
      rotateX: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: -30,
      rotateX: -15,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Animation variants for backdrop
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.3,
        delay: 0.1
      }
    }
  };

  // Animation for form switch
  const formVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 20, 
        stiffness: 300 
      } 
    },
    exit: { 
      opacity: 0, 
      x: -50, 
      scale: 0.9,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  // Animation for pattern overlay
  const patternVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 0.05,
      transition: { 
        duration: 0.8
      } 
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className={styles.backdrop}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div 
          className={styles.modal}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Геометрический узор вместо кругов */}
          <motion.div 
            className={styles.patternOverlay}
            variants={patternVariants}
            initial="hidden"
            animate="visible"
          />
          
          <motion.button 
            className={styles.closeButton} 
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiX />
          </motion.button>
          
          <div className={styles.modalContent}>
            <AnimatePresence mode="wait">
              {activeForm === 'login' ? (
                <motion.div
                  key="login"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={styles.formWrapper}
                >
                  <LoginForm 
                    onSuccess={handleSuccess}
                    onSwitchToRegister={handleSwitchToRegister}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={styles.formWrapper}
                >
                  <RegisterForm 
                    onSuccess={handleSuccess}
                    onSwitchToLogin={handleSwitchToLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal; 