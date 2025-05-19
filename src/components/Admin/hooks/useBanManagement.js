import { useState } from 'react';
import supabase from '../../../services/supabaseClient';
import { loadProfilesDirectly } from '../services/adminUtils';

export const useBanManagement = (user, setTemporaryMessage, setUsers) => {
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banDialogUser, setBanDialogUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [banLoading, setBanLoading] = useState(false);

  // Ban a user
  const handleBanUser = async (e) => {
    if (e) e.preventDefault();
    
    if (!banDialogUser || !banReason.trim() || !banDuration) return;
    
    try {
      setBanLoading(true);
      
      // Calculate ban end date
      let banEndDate = null;
      
      if (banDuration !== 'permanent') {
        banEndDate = new Date();
        
        switch (banDuration) {
          case '30m': banEndDate.setMinutes(banEndDate.getMinutes() + 30); break;
          case '2h': banEndDate.setHours(banEndDate.getHours() + 2); break;
          case '6h': banEndDate.setHours(banEndDate.getHours() + 6); break;
          case '12h': banEndDate.setHours(banEndDate.getHours() + 12); break;
          case '24h': banEndDate.setHours(banEndDate.getHours() + 24); break;
          case '7d': banEndDate.setDate(banEndDate.getDate() + 7); break;
          default: banEndDate = null;
        }
      }
      
      // Create ban record
      const banData = {
        user_id: banDialogUser.id,
        admin_id: user.id,
        admin_name: user.displayName,
        reason: banReason.trim(),
        created_at: new Date().toISOString(),
        end_at: banEndDate ? banEndDate.toISOString() : null,
        is_active: true,
        ban_type: banDuration
      };
      
      // Save to user_bans table
      const { error: banError } = await supabase
        .from('user_bans')
        .insert(banData);
        
      if (banError) {
        throw new Error(`Ошибка при сохранении бана: ${banError.message}`);
      }
      
      // Update profile with ban data
      const profileUpdateData = { 
        is_banned: true,
        ban_reason: banReason.trim(),
        ban_end_at: banEndDate ? banEndDate.toISOString() : null,
        ban_admin_id: user.id,
        ban_admin_name: user.displayName
      };
      
      await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', banDialogUser.id);
      
      // Reload users list
      const updatedUsers = await loadProfilesDirectly();
      setUsers(updatedUsers);
      
      setTemporaryMessage({
        type: 'success',
        text: `Пользователь ${banDialogUser.displayName} успешно заблокирован`
      });
      
      // Reset states
      setShowBanDialog(false);
      setBanReason('');
      setBanDuration('');
      setBanDialogUser(null);
      
    } catch (error) {
      setTemporaryMessage({
        type: 'error',
        text: `Ошибка при блокировке: ${error.message}`
      });
    } finally {
      setBanLoading(false);
    }
  };
  
  // Unban a user
  const handleUnbanUser = async (userId) => {
    if (!userId) return;
    
    try {
      setBanLoading(true);
      
      // Find user in list for message
      const allUsers = await loadProfilesDirectly();
      const userToUnban = allUsers.find(u => u.id === userId);
      
      // Update ban records
      await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);
      
      // Reset ban flags in profile
      const profileUpdateData = { 
        is_banned: false,
        ban_reason: null,
        ban_end_at: null,
        ban_admin_id: null,
        ban_admin_name: null
      };
      
      await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);
      
      // Reload users list
      const updatedUsers = await loadProfilesDirectly();
      setUsers(updatedUsers);
      
      setTemporaryMessage({
        type: 'success',
        text: `Пользователь ${userToUnban?.displayName || 'выбранный'} успешно разблокирован`
      });
      
      // Close dialog if open
      if (showBanDialog) {
        setShowBanDialog(false);
        setBanDialogUser(null);
      }
    } catch (error) {
      setTemporaryMessage({
        type: 'error',
        text: `Ошибка при разблокировке: ${error.message}`
      });
    } finally {
      setBanLoading(false);
    }
  };

  return {
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
  };
}; 