import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import styles from '../../ProfilePage.module.scss';
import perkStyles from '../../../../styles/Perks.module.scss';

const PerkModal = ({ perks, activePerk, onSelectPerk, onClose, userId }) => {
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
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);
  
  // Обработчик клика по фону для закрытия модального окна
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Название модального окна с ID пользователя для администратора
  const modalTitle = userId ? 
    `Выбор привилегии для пользователя (${userId.substring(0, 8)}...)` : 
    'Выберите привилегию';
  
  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX size={20} />
        </button>
        
        <div className={styles.modalContent}>
          <h3>{modalTitle}</h3>
          
          <div className={styles.perksList}>
            {perks.map(perk => {
              const perkClass = perk === 'sponsor' ? perkStyles.sponsorPerk : 
                              perk === 'early_user' ? perkStyles.earlyUserPerk : 
                              perk === 'admin' ? perkStyles.adminPerk : perkStyles.userPerk;
              
              return (
                <motion.div
                  key={perk}
                  className={`${styles.perkOption} ${perk === activePerk ? styles.activePerkOption : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectPerk(perk)}
                >
                  <div className={`${styles.perkName} ${perkClass}`}>
                    {perk === 'sponsor' && 'Спонсор'}
                    {perk === 'early_user' && 'Ранний пользователь'}
                    {perk === 'admin' && 'Администратор'}
                    {perk === 'user' && 'Пользователь'}
                  </div>
                  {perk === activePerk && (
                    <div className={styles.activePerkIndicator}>
                      <FiCheck size={16} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default PerkModal; 