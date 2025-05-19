import React, { useState } from 'react';
import { FiAlertCircle, FiCheck, FiX, FiLoader, FiEdit, FiUser, FiMail, FiCalendar, FiShield, FiSettings, FiSave, FiUserX, FiInfo, FiCheckCircle } from 'react-icons/fi';
import supabase from '../../../services/supabaseClient';
import authService from '../../../services/authService';
import styles from '../ProfilePage.module.scss';

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
      
      // Подготавливаем данные для обновления профиля
      const updateData = {
        display_name: formData.displayName,
        perks: formData.perks
      };
      
      // Обновляем профиль пользователя (без активного перка)
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (error) {
        throw new Error(`Ошибка при обновлении профиля: ${error.message}`);
      }
      
      // Отдельно обновляем активный перк через authService для корректного применения
      await authService.updateActivePerk(formData.activePerk, null, user.id);
      
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

export default AdminProfileEditForm; 