import React from 'react';
import { FiEdit, FiMail, FiCalendar } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';
import perkStyles from '../../../styles/Perks.module.scss';
import OptimizedAvatar from '../../shared/OptimizedAvatar';
import { AVATARS } from '../../../utils/cloudinary';
import { formatDate } from './ProfileUtils';

const ProfileHeader = ({ 
  profileUser, 
  isOwnProfile, 
  isAdmin, 
  avatarManager, 
  perkManager, 
  getActivePerkClass, 
  getActivePerkName 
}) => {
  return (
    <div className={styles.profileHeader}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarContainer}>
          <OptimizedAvatar 
            src={profileUser.avatar || AVATARS.GUEST} 
            alt={profileUser.displayName || 'Пользователь'} 
            className={styles.profileAvatar}
          />
        </div>
        
        {(isOwnProfile || isAdmin) && (
          <button 
            className={styles.changeAvatarButton}
            onClick={avatarManager.handleAvatarChange}
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
        
        <div className={styles.perksContainer}>
          <div 
            className={`${styles.activePerk} ${getActivePerkClass()}`}
            onClick={(isOwnProfile || isAdmin) && (profileUser.perks?.length > 1) ? perkManager.handleOpenPerkModal : undefined}
            style={{ cursor: (isOwnProfile || isAdmin) && (profileUser.perks?.length > 1) ? 'pointer' : 'default' }}
          >
            {getActivePerkName()}
            {(isOwnProfile || isAdmin) && (profileUser.perks?.length > 1) && (
              <FiEdit size={16} className={styles.editPerkIcon} />
            )}
          </div>
        </div>
        
        <div className={styles.profileDetails}>
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
  );
};

export default ProfileHeader; 