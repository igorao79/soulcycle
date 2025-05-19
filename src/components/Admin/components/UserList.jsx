import React from 'react';
import styles from '../AdminPanel.module.scss';
import { FiUser, FiEdit, FiLock, FiUnlock, FiLoader } from 'react-icons/fi';
import { Avatar } from '../../../utils/cloudinary';

const UserList = ({
  users,
  loading,
  selectedUser,
  handleSelectUser,
  handleUnbanUser,
  setShowBanDialog,
  setBanDialogUser,
  setTemporaryMessage
}) => {
  // Handle ban button click
  const handleBanClick = (user) => {
    setBanDialogUser(user);
    setShowBanDialog(true);
  };
  
  // Check if user is protected (admin or developer)
  const isUserProtected = (user) => {
    // Get stored admin email
    const adminEmail = localStorage.getItem('userEmail');
    
    // Don't allow banning yourself or other admins/developers
    return (
      user.email === adminEmail ||
      user.perks?.includes('admin') || 
      user.perks?.includes('developer')
    );
  };

  return (
    <div className={styles.userList}>
      {loading ? (
        <div className={styles.loader}>
          <FiLoader size={24} /> Загрузка пользователей...
        </div>
      ) : (
        <>
          {users.length === 0 ? (
            <p>Пользователи не найдены</p>
          ) : (
            <div className={styles.userGrid}>
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className={`${styles.userCard} ${
                    selectedUser?.id === user.id ? styles.selected : ''
                  } ${user.is_banned ? styles.banned : ''}`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className={styles.userAvatar}>
                    {user.avatar ? (
                      <Avatar 
                        avatar={user.avatar}
                        alt={user.displayName || 'Пользователь'} 
                        size={64}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    ) : (
                      <FiUser size={32} />
                    )}
                  </div>
                  
                  <div className={styles.userInfo}>
                    <h3>{user.displayName || 'Без имени'}</h3>
                    <p>{user.email}</p>
                    
                    <div className={styles.userPerks}>
                      {user.perks?.map(perk => (
                        <span 
                          key={perk} 
                          className={`${styles.perk} ${styles[perk]}`}
                        >
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.userActions}>
                    <button 
                      className={styles.editButton} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(user);
                      }}
                      title="Редактировать профиль"
                    >
                      <FiEdit size={16} />
                    </button>
                    
                    {user.is_banned ? (
                      <button 
                        className={styles.unbanButton} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnbanUser(user.id);
                        }}
                        title="Разблокировать пользователя"
                      >
                        <FiUnlock size={16} />
                      </button>
                    ) : (
                      <button 
                        className={styles.banButton} 
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          // Check if user is protected
                          if (isUserProtected(user)) {
                            setTemporaryMessage({
                              type: 'error',
                              text: 'Нельзя заблокировать администратора или разработчика'
                            });
                            return;
                          }
                          
                          handleBanClick(user);
                        }}
                        title="Заблокировать пользователя"
                        disabled={isUserProtected(user)}
                      >
                        <FiLock size={16} />
                      </button>
                    )}
                  </div>
                  
                  {user.is_banned && (
                    <div className={styles.banInfo}>
                      <p>Заблокирован: {user.ban_reason}</p>
                      {user.ban_end_at && (
                        <p>До: {new Date(user.ban_end_at).toLocaleString()}</p>
                      )}
                      <p>Админ: {user.ban_admin_name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserList; 