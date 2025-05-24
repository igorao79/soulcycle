import React, { useState } from 'react';
import { AVATARS } from '../../../utils/cloudinary';
import authService from '../../../services/authService';
import { PROFILE_AVATARS, ADMIN_AVATARS } from './ProfileUtils';

const AvatarManager = (props) => {
  const { profileUser, isOwnProfile, isAdmin, updateProfileUser } = props;
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Handle opening the avatar change modal
  const handleAvatarChange = () => {
    setIsAvatarModalOpen(true);
  };
  
  // Handle selecting a new avatar
  const handleAvatarSelect = async (avatarId) => {
    try {
      // Находим выбранный аватар по ID
      const selectedAvatar = [...PROFILE_AVATARS, ...ADMIN_AVATARS].find(
        avatar => avatar.id === avatarId
      );
      
      if (!selectedAvatar) {
        console.error('Avatar not found:', avatarId);
        return;
      }
      
      // Determine if we're updating our own avatar or someone else's (admin only)
      const targetUserId = !isOwnProfile && isAdmin ? profileUser.id : null;
      
      // Call the API to update the avatar
      const result = await authService.updateAvatar(selectedAvatar.name, targetUserId);
      
      if (result.success) {
        // Update the profile user state with the actual avatar name
        updateProfileUser({
          ...profileUser,
          avatar: selectedAvatar.name
        });
        
        // Force reload avatar in header by updating localStorage
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        userData.avatar = selectedAvatar.name;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Dispatch storage event for other tabs
        if (typeof window !== 'undefined') {
          const event = new StorageEvent('storage', {
            key: 'user',
            newValue: JSON.stringify(userData),
            url: window.location.href
          });
          window.dispatchEvent(event);
        }
      }
      
      // Close the modal
      setIsAvatarModalOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      // Keep the modal open on error
    }
  };
  
  return {
    isAvatarModalOpen,
    setIsAvatarModalOpen,
    handleAvatarChange,
    handleAvatarSelect
  };
};

export default AvatarManager; 