import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import styles from './ProfilePage.module.scss';
import perkStyles from '../../styles/Perks.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiX, FiLoader, FiEdit, FiUser, FiMail, FiCalendar, FiShield, FiSettings, FiSave, FiUserX, FiInfo, FiCheckCircle, FiClock } from 'react-icons/fi';
import supabase from '../../services/supabaseClient';
import { Avatar, AVATARS, CloudinaryImage } from '../../utils/cloudinary';
import OptimizedAvatar from '../shared/OptimizedAvatar';
import ReactDOM from 'react-dom';

// Доступные аватарки
const PROFILE_AVATARS = [
  { id: 1, name: AVATARS.GUEST, displayName: 'Гость' },
  { id: 2, name: AVATARS.VIVIAN, displayName: 'Вивиан' },
  { id: 3, name: AVATARS.AKITO, displayName: 'Акито' },
  { id: 4, name: AVATARS.LONARIUS, displayName: 'Лонариус' },
  { id: 5, name: AVATARS.FAUST, displayName: 'Фауст' }
];

// Особые аватарки только для администраторов
const ADMIN_AVATARS = [
  { id: 101, name: AVATARS.IGOR, displayName: 'Игорь', adminOnly: true },
  { id: 102, name: AVATARS.LESYA, displayName: 'Леся', adminOnly: true }
];

// Компонент модального окна для выбора привилегии
const PerkModal = ({ perks, activePerk, onSelectPerk, onClose }) => {
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
  
  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX size={20} />
        </button>
        
        <div className={styles.modalContent}>
          <h3>Выберите привилегию</h3>
          
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

// Компонент модального окна для изменения имени пользователя
const ChangeNameModal = ({ onClose, onSubmit, initialName }) => {
  const [newName, setNewName] = useState(initialName || '');
  const [password, setPassword] = useState('');
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
    
    if (!newName.trim()) {
      setError('Имя пользователя не может быть пустым');
      return;
    }
    
    if (!password) {
      setError('Введите пароль для подтверждения');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(newName.trim(), password);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setError(error.message || 'Не удалось обновить имя пользователя');
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
          <h3>Изменить имя пользователя</h3>
          
          {success ? (
            <motion.div 
              className={styles.successMessage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiCheck size={20} />
              <span>Имя пользователя успешно изменено!</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="newName">Новое имя:</label>
                <input
                  type="text"
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Введите новое имя"
                  className={styles.formControl}
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">Введите пароль для подтверждения:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ваш текущий пароль"
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

// Компонент модального окна для изменения пароля
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

// Компонент модального окна для выбора аватара
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

// AdminProfileEditForm component:
const AdminProfileEditForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    perks: user.perks || ['user'],
    activePerk: user.activePerk || 'user'
  });
  const [loading, setLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Обработчик изменения привилегий
  const handlePerkChange = (perk) => {
    // Если это пользовательская привилегия, её нельзя убрать
    if (perk === 'user') return;
    
    const newPerks = formData.perks.includes(perk)
      ? formData.perks.filter(p => p !== perk)
      : [...formData.perks, perk];
      
    // Убедимся, что 'user' всегда присутствует в перках
    if (!newPerks.includes('user')) {
      newPerks.push('user');
    }
    
    setFormData({
      ...formData,
      perks: newPerks
    });
  };
  
  // Обработчик выбора активной привилегии
  const handleActivePerkChange = (e) => {
    const selectedPerk = e.target.value;
    
    // Проверяем, есть ли выбранная привилегия в списке привилегий пользователя
    if (!formData.perks.includes(selectedPerk)) {
      setFormStatus({
        type: 'error',
        message: 'Нельзя установить активную привилегию, которой нет у пользователя'
      });
      return;
    }
    
    setFormData({
      ...formData,
      activePerk: selectedPerk
    });
    
    setFormStatus({ type: '', message: '' });
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setFormStatus({ type: '', message: '' });
      
      // Проверяем, что активная привилегия есть в списке привилегий
      if (!formData.perks.includes(formData.activePerk)) {
        setFormStatus({
          type: 'error',
          message: 'Активная привилегия должна быть в списке привилегий пользователя'
        });
        setLoading(false);
        return;
      }
      
      // Подготавливаем данные для обновления
      const updateData = {
        display_name: formData.displayName,
        perks: formData.perks,
        active_perk: formData.activePerk
      };
      
      // Обновляем профиль пользователя
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (error) {
        throw new Error(`Ошибка при обновлении профиля: ${error.message}`);
      }
      
      // Получаем обновленные данные пользователя
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) {
        throw new Error(`Ошибка при получении обновленного профиля: ${fetchError.message}`);
      }
      
      // Конвертируем формат полей
      const updatedUser = {
        ...user,
        displayName: updatedProfile.display_name,
        perks: updatedProfile.perks,
        activePerk: updatedProfile.active_perk
      };
      
      // Отображаем сообщение об успехе
      setFormStatus({
        type: 'success',
        message: 'Профиль пользователя успешно обновлен'
      });
      
      // Вызываем колбэк с обновленными данными
      setTimeout(() => {
        onSave(updatedUser);
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      setFormStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.adminEditForm} onSubmit={handleSubmit}>
      {formStatus.message && (
        <div className={`${styles.statusMessage} ${styles[formStatus.type]}`}>
          {formStatus.type === 'error' && <FiAlertCircle />}
          {formStatus.type === 'success' && <FiCheckCircle />}
          {formStatus.type === 'info' && <FiInfo />}
          {formStatus.message}
        </div>
      )}
      
      <div className={styles.formGroup}>
        <label htmlFor="displayName">
          <FiUser /> Отображаемое имя:
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="Имя пользователя"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>
          <FiShield /> Привилегии:
        </label>
        <div className={styles.perksOptions}>
          <div className={`${styles.perkOption} ${styles.basePerk}`}>
            <input
              type="checkbox"
              id="perk-user"
              checked={true}
              disabled={true}
              readOnly
            />
            <label htmlFor="perk-user" className={styles.baseLabel}>
              Пользователь <span className={styles.baseNote}>(базовая привилегия)</span>
            </label>
          </div>
          
          <div className={styles.perkOption}>
            <input
              type="checkbox"
              id="perk-early_user"
              checked={formData.perks.includes('early_user')}
              onChange={() => handlePerkChange('early_user')}
            />
            <label htmlFor="perk-early_user">
              Ранний пользователь
            </label>
          </div>
          
          <div className={styles.perkOption}>
            <input
              type="checkbox"
              id="perk-sponsor"
              checked={formData.perks.includes('sponsor')}
              onChange={() => handlePerkChange('sponsor')}
            />
            <label htmlFor="perk-sponsor">
              Спонсор
            </label>
          </div>
          
          <div className={styles.perkOption}>
            <input
              type="checkbox"
              id="perk-admin"
              checked={formData.perks.includes('admin')}
              onChange={() => handlePerkChange('admin')}
            />
            <label htmlFor="perk-admin">
              Администратор
            </label>
          </div>
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="activePerk">
          <FiShield /> Активная привилегия:
        </label>
        <select
          id="activePerk"
          name="activePerk"
          value={formData.activePerk}
          onChange={handleActivePerkChange}
          className={styles.selectPerk}
        >
          {formData.perks.map(perk => (
            <option key={perk} value={perk}>
              {perk === 'user' && 'Пользователь'}
              {perk === 'early_user' && 'Ранний пользователь'}
              {perk === 'sponsor' && 'Спонсор'}
              {perk === 'admin' && 'Администратор'}
            </option>
          ))}
        </select>
      </div>
      
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          <FiX /> Отмена
        </button>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? <FiLoader /> : <FiSave />} Сохранить
        </button>
      </div>
    </form>
  );
};

// Компонент модального окна для блокировки пользователя
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

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPerkModalOpen, setIsPerkModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [adminEditStatus, setAdminEditStatus] = useState({ type: '', message: '' });
  
  // Ban-related state
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [banInfo, setBanInfo] = useState(null);
  
  // Маркер, который указывает, просматривает ли пользователь свой профиль
  const isOwnProfile = !userId || (currentUser && userId === currentUser.id);
  
  // Маркер, который указывает, является ли пользователь администратором
  const isAdmin = currentUser && (
    currentUser.email === 'igoraor79@gmail.com' || 
    currentUser.perks?.includes('admin') || 
    currentUser.activePerk === 'admin'
  );
  
  // Перенаправление на главную, если пользователь не авторизован
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !userId) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, userId]);
  
  // Загрузка информации о профиле
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (authLoading) return; // Ждем загрузки данных аутентификации
        
        setLoading(true);
        
        if (isOwnProfile && currentUser) {
          // Если пользователь просматривает свой профиль
          setProfileUser({
            ...currentUser,
            role: currentUser.email === 'igoraor79@gmail.com' ? 'admin' : (currentUser.role || 'user')
          });
          setError(null);
          console.log('Отображаем данные текущего пользователя:', currentUser);
        } else if (userId) {
          try {
            // Проверяем формат UUID для userId
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
              console.warn('Некорректный формат ID пользователя:', userId);
              // Но продолжаем попытку получить пользователя, т.к. формат ID может измениться
            }
            
            // Получаем информацию о пользователе через API
            console.log('Запрашиваем профиль пользователя с ID:', userId);
            const userData = await authService.getUserById(userId);
            console.log('Получены данные профиля из API:', userData);
            
            // Правильно формируем объект профиля для отображения
            setProfileUser({
              id: userData.id,
              displayName: userData.displayName || 'Пользователь',
              role: userData.role || 'user',
              email: userData.email, // Email виден всем
              avatar: userData.avatar,
              perks: userData.perks || ['user'],
              activePerk: userData.activePerk || 'user',
              createdAt: userData.createdAt,
              is_banned: userData.is_banned || false,
              ban_reason: userData.ban_reason,
              ban_end_at: userData.ban_end_at,
              ban_admin_name: userData.ban_admin_name
            });
            
            // Если пользователь заблокирован, загружаем информацию о блокировке
            if (userData.is_banned) {
              await loadBanInfo(userData.id);
            }
            
            setError(null);
          } catch (err) {
            // Если не получилось получить данные, используем заглушку или перенаправляем пользователя
            console.error('Ошибка при получении данных профиля:', err);
            
            if (err.message.includes('Неверный ID')) {
              // Перенаправляем на собственный профиль, если ID невалидный
              navigate('/profile', { replace: true });
              return;
            }
            
            setProfileUser({
              id: userId,
              displayName: 'Пользователь',
              role: 'user',
              email: isAdmin ? 'user@example.com' : null,
              avatar: null,
              perks: ['user'],
              activePerk: 'user',
              createdAt: new Date().toISOString()
            });
            console.warn('Не удалось загрузить данные пользователя, используем заглушку');
          }
        } else {
          setError('Профиль не найден');
        }
      } catch (err) {
        setError('Ошибка при загрузке профиля');
        console.error('Общая ошибка при загрузке профиля:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId, currentUser, isOwnProfile, isAdmin, authLoading, navigate]);

  // Загрузка информации о блокировке
  const loadBanInfo = async (userId) => {
    try {
      // Получаем активную блокировку пользователя
      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Ошибка при загрузке информации о блокировке:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setBanInfo(data[0]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке информации о блокировке:', error);
    }
  };

  // Обработчик блокировки пользователя
  const handleBanUser = async (reason, duration) => {
    if (!profileUser) return;
    
    try {
      setBanLoading(true);
      
      // Рассчитываем время окончания блокировки
      let banEndDate = null;
      
      if (duration !== 'permanent') {
        banEndDate = new Date();
        
        // Добавляем соответствующее время в зависимости от выбранной длительности
        switch (duration) {
          case '30m':
            banEndDate.setMinutes(banEndDate.getMinutes() + 30);
            break;
          case '2h':
            banEndDate.setHours(banEndDate.getHours() + 2);
            break;
          case '6h':
            banEndDate.setHours(banEndDate.getHours() + 6);
            break;
          case '12h':
            banEndDate.setHours(banEndDate.getHours() + 12);
            break;
          case '1d':
            banEndDate.setDate(banEndDate.getDate() + 1);
            break;
          case '3d':
            banEndDate.setDate(banEndDate.getDate() + 3);
            break;
          case '1w':
            banEndDate.setDate(banEndDate.getDate() + 7);
            break;
          default:
            banEndDate = null;
        }
      }
      
      // Создаем запись о блокировке
      const banData = {
        user_id: profileUser.id,
        admin_id: currentUser.id,
        admin_name: currentUser.displayName,
        reason: reason.trim(),
        created_at: new Date().toISOString(),
        end_at: banEndDate ? banEndDate.toISOString() : null,
        is_active: true,
        ban_type: duration
      };
      
      // Сохраняем данные блокировки в таблицу user_bans
      const { error: banError } = await supabase
        .from('user_bans')
        .insert(banData);
        
      if (banError) {
        throw new Error(`Ошибка при создании блокировки: ${banError.message}`);
      }
      
      // Устанавливаем флаг блокировки в профиле пользователя
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          ban_reason: reason.trim(),
          ban_end_at: banEndDate ? banEndDate.toISOString() : null,
          ban_admin_id: currentUser.id,
          ban_admin_name: currentUser.displayName
        })
        .eq('id', profileUser.id);
        
      if (profileError) {
        throw new Error(`Ошибка при обновлении профиля: ${profileError.message}`);
      }
      
      // Обновляем данные пользователя
      setProfileUser({
        ...profileUser,
        is_banned: true,
        ban_reason: reason.trim(),
        ban_end_at: banEndDate ? banEndDate.toISOString() : null,
        ban_admin_name: currentUser.displayName
      });
      
      // Обновляем информацию о блокировке
      loadBanInfo(profileUser.id);
      
      // Показываем сообщение об успешной блокировке
      setAdminEditStatus({
        type: 'success',
        message: `Пользователь ${profileUser.displayName} успешно заблокирован`
      });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setAdminEditStatus({ type: '', message: '' });
      }, 3000);
      
      // Закрываем диалог
      setShowBanDialog(false);
      
    } catch (error) {
      console.error('Ошибка при блокировке пользователя:', error);
      setAdminEditStatus({
        type: 'error',
        message: `Ошибка при блокировке: ${error.message}`
      });
      
      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        setAdminEditStatus({ type: '', message: '' });
      }, 5000);
    } finally {
      setBanLoading(false);
    }
  };
  
  // Обработчик разблокировки пользователя
  const handleUnbanUser = async () => {
    if (!profileUser || !profileUser.is_banned) return;
    
    try {
      setBanLoading(true);
      
      // Обновляем статус блокировки в таблице user_bans
      const { error: banError } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', profileUser.id)
        .eq('is_active', true);
        
      if (banError) {
        throw new Error(`Ошибка при обновлении блокировки: ${banError.message}`);
      }
      
      // Сбрасываем флаг блокировки в профиле пользователя
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_banned: false,
          ban_reason: null,
          ban_end_at: null,
          ban_admin_id: null,
          ban_admin_name: null
        })
        .eq('id', profileUser.id);
        
      if (profileError) {
        throw new Error(`Ошибка при обновлении профиля: ${profileError.message}`);
      }
      
      // Обновляем данные пользователя
      setProfileUser({
        ...profileUser,
        is_banned: false,
        ban_reason: null,
        ban_end_at: null,
        ban_admin_name: null
      });
      
      setBanInfo(null);
      
      // Показываем сообщение об успешной разблокировке
      setAdminEditStatus({
        type: 'success',
        message: `Пользователь ${profileUser.displayName} успешно разблокирован`
      });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setAdminEditStatus({ type: '', message: '' });
      }, 3000);
      
      // Закрываем диалог
      setShowBanDialog(false);
      
    } catch (error) {
      console.error('Ошибка при разблокировке пользователя:', error);
      setAdminEditStatus({
        type: 'error',
        message: `Ошибка при разблокировке: ${error.message}`
      });
      
      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        setAdminEditStatus({ type: '', message: '' });
      }, 5000);
    } finally {
      setBanLoading(false);
    }
  };
  
  // Форматирование времени окончания блокировки
  const formatBanEndTime = (endDate) => {
    if (!endDate) return 'Навсегда';
    
    const end = new Date(endDate);
    const now = new Date();
    
    // Если блокировка истекла, но пользователь все еще заблокирован
    if (end < now) {
      return 'Истек (требуется ручная разблокировка)';
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
      return 'Менее минуты';
    }
  };

  // Обработчики для аватара
  const handleAvatarChange = () => {
    setIsAvatarModalOpen(true);
  };
  
  const handleAvatarSelect = async (avatarId) => {
    try {
      // Находим выбранный аватар в обычных или админских аватарках
      const selectedAvatar = 
        PROFILE_AVATARS.find(avatar => avatar.id === avatarId) || 
        ADMIN_AVATARS.find(avatar => avatar.id === avatarId);
      
      if (selectedAvatar && profileUser) {
        // Проверяем, имеет ли пользователь право использовать специальные аватарки команды
        const isSpecialAvatar = selectedAvatar.name === AVATARS.IGOR || selectedAvatar.name === AVATARS.LESYA;
        if (isSpecialAvatar && !isAdmin && profileUser.activePerk !== 'admin') {
          throw new Error('У вас нет прав для использования этого аватара');
        }
        
        // Обновляем аватар в Supabase
        await authService.updateAvatar(selectedAvatar.name);
        
        // Обновляем локальный стейт
        setProfileUser({
          ...profileUser,
          avatar: selectedAvatar.name
        });
      }
      
      setIsAvatarModalOpen(false);
    } catch (error) {
      console.error('Ошибка при обновлении аватара:', error);
    }
  };
  
  const handleCloseAvatarModal = () => {
    setIsAvatarModalOpen(false);
  };

  // Обработчики для перков
  const handleOpenPerkModal = () => {
    // Проверяем, имеет ли пользователь больше одной привилегии и является ли текущий пользователь владельцем профиля или админом
    if ((isOwnProfile || isAdmin) && profileUser.perks && profileUser.perks.length > 1) {
      setIsPerkModalOpen(true);
    }
  };

  const handlePerkSelect = async (perk) => {
    try {
      // Проверяем, имеет ли пользователь право менять привилегию
      if (!isOwnProfile && !isAdmin) {
        return;
      }

      // Передаем refreshUser как коллбэк для немедленного обновления контекста пользователя
      await authService.updateActivePerk(perk, refreshUser);
      
      setProfileUser({
        ...profileUser,
        activePerk: perk
      });
      setIsPerkModalOpen(false);
    } catch (error) {
      console.error('Ошибка при обновлении привилегии:', error);
    }
  };

  const handleClosePerkModal = () => {
    setIsPerkModalOpen(false);
  };
  
  // Если данные еще не загружены, показываем индикатор загрузки
  if (loading || !profileUser) {
    return <div className={styles.loading}>Загрузка профиля...</div>;
  }
  
  // Если возникла ошибка, показываем сообщение об ошибке
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  // Форматирование даты
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error, dateString);
      return 'Неизвестно';
    }
  };

  // Получаем CSS-класс для активного перка из централизованного модуля
  const getActivePerkClass = () => {
    if (!profileUser?.activePerk) return perkStyles.userPerk;
    
    return profileUser.activePerk === 'early_user'
      ? perkStyles.earlyUserPerk
      : profileUser.activePerk === 'sponsor' 
      ? perkStyles.sponsorPerk
      : profileUser.activePerk === 'admin'
      ? perkStyles.adminPerk
      : perkStyles.userPerk;
  };

  // Получаем имя активного перка для отображения
  const getActivePerkName = () => {
    if (!profileUser?.activePerk) return 'Пользователь';
    
    return profileUser.activePerk === 'early_user'
      ? 'Ранний пользователь'
      : profileUser.activePerk === 'sponsor'
      ? 'Спонсор'
      : profileUser.activePerk === 'admin'
      ? 'Администратор'
      : 'Пользователь';
  };
  
  // Обработчик для открытия модального окна изменения имени
  const handleOpenNameModal = () => {
    setIsNameModalOpen(true);
  };
  
  // Обработчик для открытия модального окна изменения пароля
  const handleOpenPasswordModal = () => {
    setIsPasswordModalOpen(true);
  };
  
  // Обработчик для изменения имени пользователя
  const handleChangeName = async (newName, password) => {
    try {
      await authService.updateDisplayName(newName, password, refreshUser);
      
      // Обновляем локальный стейт
      setProfileUser({
        ...profileUser,
        displayName: newName
      });
      
      setSuccessMessage('Имя пользователя успешно изменено');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Ошибка при изменении имени:', error);
      throw error;
    }
  };
  
  // Обработчик для изменения пароля
  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      
      setSuccessMessage('Пароль успешно изменен');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      throw error;
    }
  };
  
  // Обработчик сохранения профиля администратором
  const handleAdminProfileSave = async (updatedUser) => {
    // Обновляем данные профиля в состоянии
    setProfileUser(updatedUser);
    
    // Устанавливаем статус обновления
    setAdminEditStatus({
      type: 'success',
      message: 'Профиль пользователя успешно обновлен'
    });
    
    // Закрываем форму редактирования
    setIsAdminEditing(false);
    
    // Убираем сообщение через 3 секунды
    setTimeout(() => {
      setAdminEditStatus({ type: '', message: '' });
    }, 3000);
  };
  
  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <OptimizedAvatar 
              src={profileUser.avatar || AVATARS.GUEST} 
              alt={profileUser.displayName || 'Пользователь'} 
              className={styles.profileAvatar}
            />
          </div>
          
          {/* Кнопка изменения аватара - доступна только владельцу или админу */}
          {(isOwnProfile || isAdmin) && (
            <button 
              className={styles.changeAvatarButton}
              onClick={handleAvatarChange}
              aria-label="Изменить аватар"
            >
              <FiEdit size={18} /> <span className={styles.buttonText}>Изменить аватар</span>
            </button>
          )}
        </div>
        
        <div className={styles.profileInfo}>
          <h1 className={`${styles.displayName} ${getActivePerkClass()}`}>
            {profileUser.displayName || 'Пользователь'}
            {isAdmin && <span className={styles.adminLabel}> (ID: {profileUser.id.substring(0, 8)}...)</span>}
          </h1>
          
          {profileUser.perks && profileUser.perks.length > 0 && (
            <div className={styles.perksContainer}>
              <div 
                className={`${styles.activePerk} ${getActivePerkClass()}`}
                onClick={(isOwnProfile || isAdmin) && profileUser.perks.length > 1 ? handleOpenPerkModal : undefined}
                style={{ cursor: (isOwnProfile || isAdmin) && profileUser.perks.length > 1 ? 'pointer' : 'default' }}
              >
                {getActivePerkName()}
                {(isOwnProfile || isAdmin) && profileUser.perks.length > 1 && (
                  <FiEdit size={16} className={styles.editPerkIcon} />
                )}
              </div>
            </div>
          )}
          
          <div className={styles.profileDetails}>
            {/* Email виден всем пользователям */}
            {profileUser.email && (
              <div className={styles.profileDetail}>
                <FiMail className={styles.detailIcon} size={20} />
                <span>{profileUser.email}</span>
              </div>
            )}
            
            <div className={styles.profileDetail}>
              <FiCalendar className={styles.detailIcon} size={20} />
              <span>Регистрация: {formatDate(profileUser.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Админские действия */}
      {isAdmin && !isOwnProfile && (
        <div className={styles.adminActions}>
          <h2><FiShield /> Администрирование</h2>
          
          {adminEditStatus.message && (
            <div className={`${styles.statusMessage} ${styles[adminEditStatus.type]}`}>
              {adminEditStatus.type === 'error' ? <FiAlertCircle /> : 
               adminEditStatus.type === 'success' ? <FiCheckCircle /> : 
               <FiInfo />}
              {adminEditStatus.message}
            </div>
          )}
          
          {profileUser.is_banned && (
            <div className={styles.banInfoBox}>
              <h3>Информация о блокировке</h3>
              <div className={styles.banDetails}>
                <p><strong>Статус:</strong> <span className={styles.bannedStatus}>Заблокирован</span></p>
                {profileUser.ban_reason && (
                  <p><strong>Причина:</strong> {profileUser.ban_reason}</p>
                )}
                {profileUser.ban_admin_name && (
                  <p><strong>Заблокировал:</strong> {profileUser.ban_admin_name}</p>
                )}
                {profileUser.ban_end_at && (
                  <p>
                    <strong>Окончание через:</strong> 
                    <span className={styles.banDuration}>
                      <FiClock /> {formatBanEndTime(profileUser.ban_end_at)}
                    </span>
                  </p>
                )}
              </div>
              <button 
                className={styles.unbanButton}
                onClick={handleUnbanUser}
                disabled={banLoading}
              >
                {banLoading ? <FiLoader /> : <FiCheck />} Снять блокировку
              </button>
            </div>
          )}
          
          {!isAdminEditing ? (
            <div className={styles.actionButtons}>
              <button 
                className={styles.editButton}
                onClick={() => setIsAdminEditing(true)}
              >
                <FiEdit /> Редактировать профиль
              </button>
              
              {!profileUser.is_banned && profileUser.email !== 'igoraor79@gmail.com' && (
                <button 
                  className={styles.banButton}
                  onClick={() => setShowBanDialog(true)}
                  disabled={banLoading}
                >
                  <FiUserX /> Заблокировать
                </button>
              )}
            </div>
          ) : (
            <AdminProfileEditForm 
              user={profileUser}
              onSave={handleAdminProfileSave}
              onCancel={() => setIsAdminEditing(false)}
            />
          )}
        </div>
      )}
      
      {/* Личные настройки (видны только владельцу) */}
      {isOwnProfile && (
        <div className={styles.personalSettings}>
          <h2>Личные настройки</h2>
          
          {successMessage && (
            <div className={styles.successMessage}>
              <FiCheck size={16} />
              <span>{successMessage}</span>
            </div>
          )}
          
          <div className={styles.settingGroup}>
            <label htmlFor="displayName">Имя пользователя:</label>
            <div className={styles.settingControl}>
              <input 
                type="text" 
                id="displayName" 
                value={profileUser.displayName || 'Пользователь'} 
                readOnly 
              />
              <button 
                className={styles.editButton}
                onClick={handleOpenNameModal}
              >
                Изменить
              </button>
            </div>
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="password">Пароль:</label>
            <div className={styles.settingControl}>
              <input 
                type="password" 
                id="password" 
                value="••••••" 
                readOnly 
              />
              <button 
                className={styles.editButton}
                onClick={handleOpenPasswordModal}
              >
                Изменить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальные окна */}
      {isAvatarModalOpen && <AvatarModal 
        avatars={PROFILE_AVATARS}
        adminAvatars={ADMIN_AVATARS}
        isAdmin={isAdmin || (profileUser?.activePerk === 'admin')}
        onSelectAvatar={handleAvatarSelect}
        onClose={handleCloseAvatarModal}
      />}
      
      {isPerkModalOpen && <PerkModal 
        perks={profileUser.perks || ['user']}
        activePerk={profileUser.activePerk || 'user'}
        onSelectPerk={handlePerkSelect}
        onClose={handleClosePerkModal}
      />}
      
      {isNameModalOpen && <ChangeNameModal 
        onClose={() => setIsNameModalOpen(false)}
        onSubmit={handleChangeName}
        initialName={profileUser?.displayName}
      />}
      
      {isPasswordModalOpen && <ChangePasswordModal 
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />}
      
      {/* Диалог блокировки пользователя */}
      {showBanDialog && (
        <BanDialog 
          onClose={() => setShowBanDialog(false)}
          onBanUser={handleBanUser}
          loading={banLoading}
          username={profileUser.displayName}
        />
      )}
    </div>
  );
};

export default ProfilePage; 