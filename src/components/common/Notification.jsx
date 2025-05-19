import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import styles from './Notification.module.scss';

/**
 * Reusable notification component with smooth animations
 * @param {Object} props
 * @param {string} props.type - Type of notification: 'error', 'success', or 'info'
 * @param {string} props.message - Message to display
 * @param {boolean} props.show - Whether to show the notification
 * @param {Function} props.onClose - Optional callback for when notification is closed
 * @param {number} props.autoCloseDelay - Delay in ms before auto-closing (default: 3000ms)
 */
const Notification = ({ 
  type = 'info', 
  message, 
  show = true, 
  onClose,
  autoCloseDelay = 3000
}) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (show && onClose) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set new timer to auto-close after specified delay
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
    }
    
    // Cleanup timer when component unmounts or when dependencies change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [show, onClose, autoCloseDelay]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <FiAlertCircle size={20} />;
      case 'success':
        return <FiCheckCircle size={20} />;
      default:
        return <FiInfo size={20} />;
    }
  };

  const variants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`${styles.notification} ${styles[type]}`}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.iconContainer}>
            {getIcon()}
          </div>
          <div className={styles.messageContainer}>
            {message}
          </div>
          {onClose && (
            <button 
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification; 