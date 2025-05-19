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
  const handleAvatarSelect = async (avatarName) => {
    try {
      // Determine if we're updating our own avatar or someone else's (admin only)
      const targetUserId = !isOwnProfile && isAdmin ? profileUser.id : null;
      
      // Call the API to update the avatar
      const result = await authService.updateAvatar(avatarName, targetUserId);
      
      if (result.success) {
        // Update the profile user state
        updateProfileUser({
          ...profileUser,
          avatar: avatarName
        });
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