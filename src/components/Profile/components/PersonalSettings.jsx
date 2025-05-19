import React from 'react';
import { FiCheck } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';

const PersonalSettings = ({ profileUser, successMessage, accountManager }) => {
  return (
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
            onClick={() => accountManager.setIsNameModalOpen(true)}
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
            onClick={() => accountManager.setIsPasswordModalOpen(true)}
          >
            Изменить
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalSettings; 