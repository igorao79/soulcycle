import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AdminPanel.module.scss';
import { FiSettings, FiUsers, FiEdit, FiUser, FiLoader } from 'react-icons/fi';
import { SUPER_ADMIN_EMAIL } from '../../services/auth/authCore';

// Import subcomponents
import UserList from './components/UserList';
import UserEditForm from './components/UserEditForm';
import SiteEvents from './components/SiteEvents';
import BanDialog from './components/BanDialog';
import MessageDisplay from './components/MessageDisplay';

// Import custom hooks
import { useUserManagement } from './hooks/useUserManagement';
import { useBanManagement } from './hooks/useBanManagement';
import { useSiteEvents } from './hooks/useSiteEvents';
import { useMessageSystem } from './hooks/useMessageSystem';

const AdminPanel = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hasInitializedRef = useRef(false);
  const initAttemptedRef = useRef(false);
  
  // Determine if user is admin (optimized)
  const isAdmin = useMemo(() => user && (
    user.email === SUPER_ADMIN_EMAIL || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  ), [user]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [temporaryMessage, setTemporaryMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use message system hook
  const { message, setTemporaryMessage: setTemporaryMessageSystem } = useMessageSystem();
  
  // Use site events hook
  const { 
    siteEvents,
    eventsLoading,
    loadSiteEvents,
    toggleSiteEvent
  } = useSiteEvents(user, setTemporaryMessage);
  
  // Use user management hook
  const { 
    users,
    loading: usersLoading,
    selectedUser, 
    isEditing, 
    formData,
    loadUsers,
    handleSelectUser,
    handleChange,
    handlePerkChange,
    handleSubmit,
    setIsEditing,
  } = useUserManagement(user, isAuthenticated, setTemporaryMessageSystem);
  
  // Use ban management hook
  const {
    showBanDialog,
    setShowBanDialog,
    banDialogUser,
    setBanDialogUser,
    banReason,
    setBanReason,
    banDuration,
    setBanDuration,
    banLoading,
    handleBanUser,
    handleUnbanUser
  } = useBanManagement(user, setTemporaryMessageSystem, users);
  
  // Check admin access when component mounts
  useEffect(() => {
    // Don't do anything until auth is finished loading
    if (authLoading) {
      return;
    }
    
    // Once auth is loaded, check admin status
    if (!isAdmin && !authLoading) {
      // If not admin, redirect to home
      navigate('/');
      return;
    }
    
    // If admin and not initialized, load data
    if (isAdmin && !hasInitializedRef.current && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      
      const initializeData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([loadUsers(), loadSiteEvents()]);
          hasInitializedRef.current = true;
        } catch (error) {
          console.error('Error initializing admin panel:', error);
          setTemporaryMessageSystem({
            type: 'error',
            text: 'Ошибка загрузки данных. Пожалуйста, обновите страницу.'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      initializeData();
    } else if (isAdmin && hasInitializedRef.current) {
      // If admin and already initialized, just make sure loading is off
      setIsLoading(false);
    }
  }, [authLoading, isAdmin, navigate, loadUsers, loadSiteEvents, setTemporaryMessageSystem]);
  
  // Show loading state until auth and admin check is complete
  if (authLoading || isLoading) {
    return (
      <div className={styles.adminPanel}>
        <h1 className={styles.title}>
          <FiSettings size={24} /> Панель администратора
        </h1>
        <div className={styles.loadingContainer}>
          <FiLoader size={32} className={styles.spinningLoader} />
          <p>Загрузка панели администратора...</p>
        </div>
      </div>
    );
  }
  
  // Redirect if not admin
  if (!user || !isAdmin) {
    return null;
  }
  
  return (
    <div className={styles.adminPanel}>
      <h1 className={styles.title}>
        <FiSettings size={24} /> Панель администратора
      </h1>
      
      <MessageDisplay message={message} />
      
      {/* Site Events Section */}
      <SiteEvents 
        siteEvents={siteEvents}
        eventsLoading={eventsLoading}
        toggleSiteEvent={toggleSiteEvent}
      />
      
      <div className={styles.content}>
        {/* Users Section */}
        <div className={styles.usersSection}>
          <h2>
            <FiUsers size={18} /> Список пользователей
          </h2>
          
          <UserList
            users={users}
            loading={usersLoading}
            selectedUser={selectedUser}
            handleSelectUser={handleSelectUser}
            handleUnbanUser={handleUnbanUser}
            setShowBanDialog={setShowBanDialog}
            setBanDialogUser={setBanDialogUser}
            setTemporaryMessage={setTemporaryMessageSystem}
          />
        </div>
        
        {/* Edit Section */}
        <div className={styles.editSection}>
          <h2>
            <FiEdit size={18} /> Редактирование профиля
          </h2>
          
          {selectedUser && isEditing ? (
            <UserEditForm
              formData={formData}
              handleChange={handleChange}
              handlePerkChange={handlePerkChange}
              handleSubmit={handleSubmit}
              loading={usersLoading}
              setIsEditing={setIsEditing}
            />
          ) : (
            <div className={styles.noUserSelected}>
              {usersLoading ? (
                <div className={styles.loader}>
                  <FiLoader size={24} /> Загрузка данных...
                </div>
              ) : (
                <p>
                  <FiUser size={64} />
                  <br />
                  Выберите пользователя из списка слева, чтобы редактировать
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Ban Dialog */}
      <BanDialog
        showBanDialog={showBanDialog}
        banDialogUser={banDialogUser}
        banReason={banReason}
        setBanReason={setBanReason}
        banDuration={banDuration}
        setBanDuration={setBanDuration}
        banLoading={banLoading}
        handleBanUser={handleBanUser}
        handleUnbanUser={handleUnbanUser}
        setShowBanDialog={setShowBanDialog}
      />
    </div>
  );
};

export default AdminPanel; 