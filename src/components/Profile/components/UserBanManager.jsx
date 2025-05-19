import React, { useState } from 'react';
import supabase from '../../../services/supabaseClient';
import { formatBanEndTime } from './ProfileUtils';
import styles from '../ProfilePage.module.scss';

const UserBanManager = (props) => {
  const { profileUser, currentUser, updateProfileUser, setAdminEditStatus } = props;
  const [banLoading, setBanLoading] = useState(false);
  const [banInfo, setBanInfo] = useState(null);
  
  // Load ban information for a user
  const loadBanInfo = async (userId) => {
    try {
      // Get ban details from the database
      const { data: banData, error: banError } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (banError) {
        console.error('Error loading ban info:', banError);
        return;
      }
      
      // If there's ban data, update the profileUser
      if (banData && banData.length > 0) {
        setBanInfo(banData[0]);
        updateProfileUser({
          ...profileUser,
          ban_info: banData[0]
        });
      }
    } catch (error) {
      console.error('Error loading ban info:', error);
    }
  };
  
  // Handle unbanning a user
  const handleUnbanUser = async () => {
    if (!currentUser || !profileUser) return;
    
    try {
      setBanLoading(true);
      
      // Update the profile to remove ban flags
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          ban_end_at: null,
          ban_admin_name: null,
          ban_admin_id: null
        })
        .eq('id', profileUser.id);
      
      if (profileError) {
        throw new Error(`Ошибка при разблокировке профиля: ${profileError.message}`);
      }
      
      // Update any active bans in the user_bans table
      const { error: banError } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', profileUser.id)
        .eq('is_active', true);
      
      if (banError) {
        console.warn('Ошибка при обновлении записей о блокировке:', banError);
        // Not critical, continue with unban
      }
      
      // Update the profile user state
      updateProfileUser({
        ...profileUser,
        is_banned: false,
        ban_reason: null,
        ban_end_at: null,
        ban_admin_name: null
      });
      
      // Show success message
      setAdminEditStatus({
        type: 'success',
        message: 'Пользователь успешно разблокирован'
      });
      
      // Clear the status after a delay
      setTimeout(() => {
        setAdminEditStatus({ type: '', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка при разблокировке пользователя:', error);
      setAdminEditStatus({
        type: 'error',
        message: error.message || 'Ошибка при разблокировке пользователя'
      });
    } finally {
      setBanLoading(false);
    }
  };
  
  // Handle banning a user
  const handleBanUser = async (banData) => {
    if (!currentUser || !profileUser) return;
    
    try {
      setBanLoading(true);
      
      const adminName = currentUser.displayName || 'Администратор';
      const banEndDate = banData.duration === 'permanent' ? null : 
        new Date(Date.now() + parseInt(banData.duration) * 24 * 60 * 60 * 1000).toISOString();
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: banData.reason,
          ban_end_at: banEndDate,
          ban_admin_name: adminName,
          ban_admin_id: currentUser.id
        })
        .eq('id', profileUser.id);
      
      if (profileError) {
        throw new Error(`Ошибка при блокировке профиля: ${profileError.message}`);
      }
      
      // Add record to user_bans table
      const { error: banError } = await supabase
        .from('user_bans')
        .insert({
          user_id: profileUser.id,
          reason: banData.reason,
          admin_id: currentUser.id,
          admin_name: adminName,
          end_at: banEndDate,
          is_active: true,
          ban_type: banData.duration === 'permanent' ? 'permanent' : 'temporary'
        });
      
      if (banError) {
        console.warn('Ошибка при создании записи о блокировке:', banError);
        // Not critical, continue with ban
      }
      
      // Update the profile user state
      updateProfileUser({
        ...profileUser,
        is_banned: true,
        ban_reason: banData.reason,
        ban_end_at: banEndDate,
        ban_admin_name: adminName
      });
      
      // Show success message
      setAdminEditStatus({
        type: 'success',
        message: 'Пользователь успешно заблокирован'
      });
      
      // Clear the status after a delay
      setTimeout(() => {
        setAdminEditStatus({ type: '', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка при блокировке пользователя:', error);
      setAdminEditStatus({
        type: 'error',
        message: error.message || 'Ошибка при блокировке пользователя'
      });
    } finally {
      setBanLoading(false);
    }
  };
  
  return {
    banLoading,
    banInfo,
    loadBanInfo,
    handleUnbanUser,
    handleBanUser,
    formatBanEndTime
  };
};

export default UserBanManager; 