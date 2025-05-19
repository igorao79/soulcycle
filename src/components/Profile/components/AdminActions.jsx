import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiClock, FiCheck, FiEdit, FiUserX, FiLoader } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';
import { formatBanEndTime } from './ProfileUtils';
import AdminProfileEditForm from './AdminProfileEditForm';

const AdminActions = ({ 
  profileUser, 
  adminEditStatus, 
  isAdminEditing, 
  banManager, 
  setIsAdminEditing, 
  setShowBanDialog, 
  handleAdminProfileSave 
}) => {
  return (
    <div className={styles.adminActions}>
      <h2><FiEdit /> Администрирование</h2>
      
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
            onClick={banManager.handleUnbanUser}
            disabled={banManager.banLoading}
          >
            {banManager.banLoading ? <FiLoader /> : <FiCheck />} Снять блокировку
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
              disabled={banManager.banLoading}
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
  );
};

export default AdminActions; 