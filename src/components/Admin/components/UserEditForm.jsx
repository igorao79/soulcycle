import React from 'react';
import { FiUser, FiMail, FiKey, FiShield, FiX, FiSave, FiLoader } from 'react-icons/fi';
import styles from '../AdminPanel.module.scss';

const UserEditForm = ({ 
  formData, 
  handleChange, 
  handlePerkChange, 
  handleSubmit, 
  loading, 
  setIsEditing 
}) => {
  return (
    <form className={styles.editForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="displayName">
          <FiUser size={18} /> Отображаемое имя:
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="Введите имя пользователя"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="email">
          <FiMail size={18} /> Email:
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Введите email"
          readOnly
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>
          <FiShield size={18} /> Привилегии:
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
      
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => setIsEditing(false)}
        >
          <FiX size={18} /> Отмена
        </button>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? <FiLoader size={18} /> : <FiSave size={18} />} Сохранить
        </button>
      </div>
    </form>
  );
};

export default UserEditForm; 