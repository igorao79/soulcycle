import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiAlertTriangle, FiClock, FiUser, FiInfo } from 'react-icons/fi';
import './BanModal.scss';

/**
 * Modal component to display ban information when a user is banned
 * @param {Object} banInfo - Information about the ban
 * @param {string} banInfo.reason - Reason for the ban
 * @param {string} banInfo.admin_name - Name of the admin who placed the ban
 * @param {string} banInfo.end_at - End date of the ban (ISO string or null if permanent)
 * @param {Function} onClose - Function to close the modal
 */
const BanModal = ({ banInfo, onClose }) => {
  if (!banInfo) {
    return null;
  }
  
  // Функция для форматирования оставшегося времени блокировки
  const formatRemainingTime = (endDate) => {
    if (!endDate) return 'Бессрочно';
    
    const end = new Date(endDate);
    const now = new Date();
    
    // Если блокировка закончилась, но модальное окно все еще показывается
    if (end < now) {
      return 'Истекло';
    }
    
    const diff = end - now;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`;
    } else {
      return 'менее минуты';
    }
  };
  
  // Анимация для модального окна
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
  };
  
  // Анимация для иконки предупреждения
  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0, 
      transition: { 
        type: "spring", 
        damping: 10, 
        stiffness: 100, 
        delay: 0.2 
      } 
    }
  };
  
  // Определение класса для времени блокировки
  const getTimeClass = () => {
    if (!banInfo.end_at) {
      return 'ban-permanent';
    }
    
    const end = new Date(banInfo.end_at);
    const now = new Date();
    const diff = end - now;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours <= 2) {
      return 'ban-short';
    } else if (hours <= 24) {
      return 'ban-medium';
    } else {
      return 'ban-long';
    }
  };
  
  return (
    <div className="ban-modal-overlay">
      <motion.div
        className="ban-modal"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
      >
        <div className="ban-modal-header">
          <motion.div
            className="ban-icon-wrapper"
            initial="hidden"
            animate="visible"
            variants={iconVariants}
          >
            <FiAlertTriangle className="ban-icon" />
          </motion.div>
          <h2>Ваш аккаунт заблокирован</h2>
          <button className="ban-close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="ban-modal-content">
          <div className="ban-details">
            <div className="ban-reason">
              <FiInfo className="ban-detail-icon" />
              <div>
                <h3>Причина блокировки:</h3>
                <p>{banInfo.reason}</p>
              </div>
            </div>
            
            <div className="ban-admin">
              <FiUser className="ban-detail-icon" />
              <div>
                <h3>Заблокировал:</h3>
                <p>{banInfo.admin_name}</p>
              </div>
            </div>
            
            <div className="ban-time">
              <FiClock className="ban-detail-icon" />
              <div>
                <h3>Срок блокировки:</h3>
                <p className={getTimeClass()}>
                  {formatRemainingTime(banInfo.end_at)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="ban-message">
            <p>
              Если вы считаете, что блокировка была наложена по ошибке, 
              пожалуйста, свяжитесь с администрацией сайта для разрешения этой ситуации.
            </p>
          </div>
          
          <button className="ban-ok-button" onClick={onClose}>
            Понятно
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BanModal; 