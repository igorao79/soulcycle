import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';
import OptimizedAvatar from '../../../shared/OptimizedAvatar';
import styles from '../../ProfilePage.module.scss';

const AvatarModal = ({ avatars, adminAvatars = [], isAdmin, onSelectAvatar, onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Combine standard and admin avatars if user is admin
  const displayedAvatars = isAdmin ? [...avatars, ...adminAvatars] : avatars;

  // Блокировка прокрутки страницы при открытии модального окна
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Обработчик нажатия Escape для закрытия модального окна
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && !isLoading && !showSuccess) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose, isLoading, showSuccess]);
  
  // Обработчик клика по фону для закрытия модального окна
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading && !showSuccess) {
      onClose();
    }
  };

  const handleSelect = async (avatar) => {
    if (isLoading || showSuccess) return;
    
    setSelectedAvatar(avatar);
    setIsLoading(true);
    
    // Имитируем загрузку для лучшего UX
    setTimeout(() => {
      setShowSuccess(true);
      setTimeout(() => {
        onSelectAvatar(avatar.id);
      }, 1000);
    }, 500);
  };

  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={isLoading || showSuccess}>
          <FiX size={20} />
        </button>
        
        <div className={styles.modalContent}>
          <h3>Выберите аватар</h3>
          
          {showSuccess && (
            <motion.div 
              className={styles.successMessage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiCheckCircle size={40} />
              <span>Аватар успешно изменен!</span>
            </motion.div>
          )}
          
          <div className={styles.avatarsGrid}>
            {displayedAvatars.map(avatar => (
              <motion.div
                key={avatar.id}
                className={`${styles.avatarCard} ${selectedAvatar?.id === avatar.id ? styles.selectedAvatar : ''} ${avatar.adminOnly ? styles.adminAvatar : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(avatar)}
              >
                <div className={styles.avatarImageContainer}>
                  <OptimizedAvatar
                    src={avatar.name}
                    alt={avatar.displayName}
                    className={styles.avatarImage}
                  />
                  
                  {selectedAvatar?.id === avatar.id && (
                    <motion.div
                      className={styles.selectedIndicator}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <FiCheck size={16} color="#fff" />
                    </motion.div>
                  )}
                  
                  {avatar.adminOnly && (
                    <span className={styles.adminAvatarBadge}>Admin</span>
                  )}
                </div>
                
                <span className={styles.avatarName}>
                  {avatar.displayName}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default AvatarModal; 