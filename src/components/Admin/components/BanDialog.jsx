import React from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiCheck, FiLoader, FiUserX } from 'react-icons/fi';
import styles from '../AdminPanel.module.scss';

const BanDialog = ({ 
  showBanDialog,
  banDialogUser,
  banReason,
  setBanReason,
  banDuration,
  setBanDuration,
  banLoading,
  handleBanUser,
  handleUnbanUser,
  setShowBanDialog
}) => {
  if (!showBanDialog || !banDialogUser) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.banDialog}>
        <div className={styles.banDialogHeader}>
          <h3>{banDialogUser.is_banned ? "Управление блокировкой" : "Блокировка пользователя"}</h3>
          <button 
            className={styles.closeButton} 
            onClick={() => setShowBanDialog(false)}
          >
            <FiX />
          </button>
        </div>
        
        <div className={styles.banDialogContent}>
          {banDialogUser.is_banned ? (
            <div className={styles.currentBanInfo}>
              <p>Пользователь <strong>{banDialogUser.displayName}</strong> в настоящее время заблокирован.</p>
              <button 
                className={styles.unbanButton}
                onClick={() => handleUnbanUser(banDialogUser.id)}
                disabled={banLoading}
              >
                {banLoading ? <FiLoader size={16} /> : <FiCheck size={16} />} Разблокировать пользователя
              </button>
            </div>
          ) : (
            <form onSubmit={handleBanUser}>
              <div className={styles.formGroup}>
                <label htmlFor="banReason">Причина блокировки:</label>
                <textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Укажите причину блокировки пользователя"
                  rows={4}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="banDuration">Длительность блокировки:</label>
                <select
                  id="banDuration"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  required
                >
                  <option value="">Выберите длительность</option>
                  <option value="30m">30 минут</option>
                  <option value="2h">2 часа</option>
                  <option value="6h">6 часов</option>
                  <option value="24h">24 часа</option>
                  <option value="7d">7 дней</option>
                </select>
              </div>
              
              <div className={styles.banDialogActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowBanDialog(false)}
                  disabled={banLoading}
                >
                  <FiX size={16} /> Отмена
                </button>
                <button
                  type="submit"
                  className={styles.banButton}
                  disabled={!banReason.trim() || !banDuration || banLoading}
                >
                  {banLoading ? <FiLoader size={16} /> : <FiUserX size={16} />} Заблокировать
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default BanDialog; 