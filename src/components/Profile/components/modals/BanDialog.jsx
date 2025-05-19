import React, { useState, useEffect } from 'react';
import { FiX, FiUserX, FiAlertCircle, FiInfo, FiClock, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';
import styles from '../../ProfilePage.module.scss';

const BanDialog = ({ onClose, onBanUser, loading, username }) => {
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [error, setError] = useState('');
  
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!banReason.trim()) {
      setError('Пожалуйста, укажите причину блокировки');
      return;
    }
    
    if (!banDuration) {
      setError('Пожалуйста, выберите длительность блокировки');
      return;
    }
    
    setError('');
    onBanUser(banReason, banDuration);
  };
  
  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>
          <FiX size={20} />
        </button>
        
        <div className={styles.modalContent}>
          <div className={styles.banModalHeader}>
            <h3><FiUserX size={22} /> Блокировка пользователя</h3>
            <p>Пользователь <strong>{username}</strong> будет заблокирован и не сможет входить в приложение или взаимодействовать с другими пользователями.</p>
          </div>
          
          {error && (
            <motion.div 
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label htmlFor="banReason">
                <FiInfo size={16} style={{marginRight: '6px'}} />
                Причина блокировки:
              </label>
              <textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Укажите причину блокировки пользователя"
                className={styles.formControl}
                rows={4}
              />
            </div>
            
            <div className={styles.modalDivider}></div>
            
            <div className={styles.formGroup}>
              <label htmlFor="banDuration">
                <FiClock size={16} style={{marginRight: '6px'}} />
                Длительность блокировки:
              </label>
              <select
                id="banDuration"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className={styles.formControl}
              >
                <option value="">Выберите длительность</option>
                <option value="30m">30 минут</option>
                <option value="2h">2 часа</option>
                <option value="6h">6 часов</option>
                <option value="12h">12 часов</option>
                <option value="1d">1 день</option>
                <option value="3d">3 дня</option>
                <option value="1w">1 неделя</option>
                <option value="permanent">Навсегда</option>
              </select>
            </div>
            
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                <FiX /> Отмена
              </button>
              <button
                type="submit"
                className={`${styles.submitButton} ${styles.banButton}`}
                disabled={loading}
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FiLoader /> Блокировка...
                  </motion.span>
                ) : (
                  <>
                    <FiUserX /> Заблокировать
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default BanDialog; 