import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUserDisplayName } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import styles from './ProfilePage.module.scss';
import perkStyles from '../../styles/Perks.module.scss';

// Import components from our refactored structure
import UserBanManager from './components/UserBanManager';
import AvatarManager from './components/AvatarManager';
import PerkManager from './components/PerkManager';
import AccountManager from './components/AccountManager';
import ProfileHeader from './components/ProfileHeader';
import AdminActions from './components/AdminActions';
import PersonalSettings from './components/PersonalSettings';
import { formatDate, formatBanEndTime, isUserAdmin } from './components/ProfileUtils';

// Import modal components
import AvatarModal from './components/modals/AvatarModal';
import PerkModal from './components/modals/PerkModal';
import ChangeNameModal from './components/modals/ChangeNameModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import BanDialog from './components/modals/BanDialog';
import { PROFILE_AVATARS, ADMIN_AVATARS } from './components/ProfileUtils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated, loading: authLoading, refreshUser, updateUserDisplayName } = useAuth();
  const { setDisplayName } = useUserDisplayName();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [adminEditStatus, setAdminEditStatus] = useState({ type: '', message: '' });
  
  // Ban-related state
  const [showBanDialog, setShowBanDialog] = useState(false);
  
  // Маркер, который указывает, просматривает ли пользователь свой профиль
  const isOwnProfile = !userId || (currentUser && userId === currentUser.id);
  
  // Маркер, который указывает, является ли пользователь администратором
  const isAdmin = currentUser && (
    currentUser.email === 'igoraor79@gmail.com' || 
    currentUser.perks?.includes('admin') || 
    currentUser.activePerk === 'admin'
  );
  
  // Обновление профиля пользователя
  const updateProfileUser = (updatedUser) => {
    setProfileUser(updatedUser);
  };
  
  // Initialize managers outside of useMemo to avoid rule of hooks violations
  // Managers should be regular objects or functions, not hooks
  const banManager = UserBanManager({
    profileUser,
    currentUser,
    updateProfileUser,
    setAdminEditStatus
  });
  
  const avatarManager = AvatarManager({ 
    profileUser, 
    isOwnProfile, 
    isAdmin, 
    updateProfileUser 
  });
  
  const perkManager = PerkManager({ 
    profileUser, 
    isOwnProfile, 
    isAdmin, 
    updateProfileUser, 
    refreshUser 
  });
  
  const accountManager = AccountManager({
    profileUser,
    updateProfileUser,
    setSuccessMessage,
    refreshUser,
    updateUserDisplayName,
    setDisplayName
  });
  
  // Перенаправление на главную, если пользователь не авторизован
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !userId) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, userId]);
  
  // Отдельный useEffect для загрузки информации о блокировке
  useEffect(() => {
    // Only load ban info if the user is banned and we have their ID
    if (profileUser?.is_banned && userId) {
      banManager.loadBanInfo(userId);
    }
  }, [profileUser?.is_banned, userId]);
  
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
            
            // Информация о блокировке загружается в отдельном useEffect
            
            setError(null);
          } catch (err) {
            // Если не получилось получить данные, используем заглушку или перенаправляем пользователя
            console.error('Ошибка при получении данных профиля:', err);
            
            if (err.message && err.message.includes('Неверный ID')) {
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
  
  // Если данные еще не загружены, показываем индикатор загрузки
  if (loading || !profileUser) {
    return <div className={styles.loading}>Загрузка профиля...</div>;
  }
  
  // Если возникла ошибка, показываем сообщение об ошибке
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
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
  
  return (
    <div className={styles.profileContainer}>
      {/* Header component */}
      <ProfileHeader 
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
        isAdmin={isAdmin}
        avatarManager={avatarManager}
        perkManager={perkManager}
        getActivePerkClass={getActivePerkClass}
        getActivePerkName={getActivePerkName}
      />
      
      {/* Admin actions - only for admins looking at other users */}
      {isAdmin && !isOwnProfile && (
        <AdminActions
          profileUser={profileUser}
          adminEditStatus={adminEditStatus}
          isAdminEditing={isAdminEditing}
          banManager={banManager}
          setIsAdminEditing={setIsAdminEditing}
          setShowBanDialog={setShowBanDialog}
          handleAdminProfileSave={handleAdminProfileSave}
        />
      )}
      
      {/* Personal settings - only for own profile */}
      {isOwnProfile && (
        <PersonalSettings
          profileUser={profileUser}
          successMessage={successMessage}
          accountManager={accountManager}
        />
      )}
      
      {/* Модальные окна */}
      {avatarManager.isAvatarModalOpen && (
        <AvatarModal 
          avatars={PROFILE_AVATARS}
          adminAvatars={ADMIN_AVATARS}
          isAdmin={isAdmin || (profileUser?.activePerk === 'admin')}
          onSelectAvatar={avatarManager.handleAvatarSelect}
          onClose={() => avatarManager.setIsAvatarModalOpen(false)}
        />
      )}
      
      {perkManager.isPerkModalOpen && (
        <PerkModal 
          perks={profileUser.perks || ['user']}
          activePerk={profileUser.activePerk || 'user'}
          onSelectPerk={perkManager.handlePerkSelect}
          onClose={() => perkManager.setIsPerkModalOpen(false)}
          userId={!isOwnProfile ? profileUser.id : undefined}
        />
      )}
      
      {accountManager.isNameModalOpen && (
        <ChangeNameModal 
          onClose={() => accountManager.setIsNameModalOpen(false)}
          onSubmit={accountManager.handleChangeName}
          initialName={profileUser?.displayName}
        />
      )}
      
      {accountManager.isPasswordModalOpen && (
        <ChangePasswordModal 
          onClose={() => accountManager.setIsPasswordModalOpen(false)}
          onSubmit={accountManager.handleChangePassword}
        />
      )}
      
      {/* Диалог блокировки пользователя */}
      {showBanDialog && (
        <BanDialog 
          onClose={() => setShowBanDialog(false)}
          onBanUser={banManager.handleBanUser}
          loading={banManager.banLoading}
          username={profileUser.displayName}
        />
      )}
    </div>
  );
};

export default ProfilePage; 