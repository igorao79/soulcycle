import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';
import styles from '../../ProfilePage.module.scss';

const ChangePasswordModal = ({ onClose, onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
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
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose, loading]);
  
  // Обработчик клика по фону для закрытия модального окна
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!currentPassword) {
      setError('Введите текущий пароль');
      return;
    }
    
    if (!newPassword) {
      setError('Введите новый пароль');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать не менее 6 символов');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setError(error.message || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };
  
  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>
          <FiX size={20} />
        </button>
        
        <div className={styles.modalContent}>
          <h3>Изменить пароль</h3>
          
          {success ? (
            <motion.div 
              className={styles.successMessage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiCheck size={20} />
              <span>Пароль успешно изменен!</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Текущий пароль:</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className={styles.formControl}
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль:</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                  className={styles.formControl}
                  disabled={loading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Подтвердите пароль:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className={styles.formControl}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <motion.div 
                  className={styles.errorMessage}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle size={18} />
                  <span>{error}</span>
                </motion.div>
              )}
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton} 
                  onClick={onClose}
                  disabled={loading}
                >
                  Отмена
                </button>
                <motion.button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Сохранение...
                    </motion.span>
                  ) : (
                    'Сохранить'
                  )}
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default ChangePasswordModal; 