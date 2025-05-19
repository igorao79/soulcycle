import { useState } from 'react';
import authService from '../../../services/authService';
import supabase from '../../../services/supabaseClient';
import { loadProfilesDirectly, updateUserPrivileges } from '../services/adminUtils';

export const useUserManagement = (user, refreshUser, setTemporaryMessage) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    perks: []
  });

  // Load users data
  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await loadProfilesDirectly();
      setUsers(userData);
      return userData;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection for editing
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName || '',
      email: user.email || '',
      perks: user.perks || ['user']
    });
    setIsEditing(true);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle perk checkbox changes
  const handlePerkChange = (perk) => {
    if (perk === 'user') return;
    
    const newPerks = formData.perks.includes(perk)
      ? formData.perks.filter(p => p !== perk)
      : [...formData.perks, perk];
      
    if (!newPerks.includes('user')) {
      newPerks.push('user');
    }
    
    setFormData({
      ...formData,
      perks: newPerks
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      let hasChanges = false;
      
      // Update user display name
      if (formData.displayName !== selectedUser.displayName) {
        await authService.adminUpdateDisplayName(
          selectedUser.id, 
          formData.displayName, 
          loadProfilesDirectly
        );
        hasChanges = true;
      }
      
      // Update user privileges
      if (JSON.stringify(formData.perks) !== JSON.stringify(selectedUser.perks)) {
        await updateUserPrivileges(selectedUser.id, formData.perks);
        hasChanges = true;
      }
      
      if (!hasChanges) {
        setTemporaryMessage({
          type: 'info',
          text: 'Нет изменений для сохранения'
        });
        setLoading(false);
        return;
      }
      
      // Reload user data
      const userData = await loadProfilesDirectly();
      setUsers(userData);
      
      // Update current user if needed
      if (user && user.id === selectedUser.id) {
        refreshUser();
      }
      
      setTemporaryMessage({
        type: 'success',
        text: 'Профиль пользователя успешно обновлен'
      });
      
      setTimeout(() => {
        setIsEditing(false);
        setSelectedUser(null);
      }, 2000);
      
    } catch (error) {
      setTemporaryMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset by email
  const handleResetPasswordByEmail = async (email) => {
    try {
      setLoading(true);
      setTemporaryMessage({
        type: 'info',
        text: `Отправка ссылки для сброса пароля на ${email}...`
      });
      
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      
      if (error) {
        throw new Error(`Ошибка при отправке ссылки: ${error.message}`);
      }
      
      setTemporaryMessage({
        type: 'success',
        text: `Ссылка для сброса пароля отправлена на ${email}`
      });
      
    } catch (err) {
      setTemporaryMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    setUsers,
    loading,
    setLoading,
    selectedUser,
    isEditing,
    formData,
    loadUsers,
    handleSelectUser,
    handleChange,
    handlePerkChange,
    handleSubmit,
    setIsEditing,
    handleResetPasswordByEmail
  };
}; 