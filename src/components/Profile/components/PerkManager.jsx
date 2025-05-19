import { useState } from 'react';
import authService from '../../../services/authService';

// Properly implement PerkManager as a function that returns an object with state and methods
const PerkManager = (props) => {
  const { profileUser, isOwnProfile, isAdmin, updateProfileUser, refreshUser } = props;
  const [isPerkModalOpen, setIsPerkModalOpen] = useState(false);
  
  // Handle opening the perk selection modal
  const handleOpenPerkModal = () => {
    setIsPerkModalOpen(true);
  };
  
  // Handle selecting a new active perk
  const handlePerkSelect = async (perkId) => {
    try {
      if (!profileUser || !perkId) return;
      
      // If user doesn't have this perk, can't select it
      if (!profileUser.perks.includes(perkId)) {
        throw new Error('У вас нет выбранной привилегии');
      }
      
      // Determine if we're updating our own perks or someone else's (admin only)
      const targetUserId = !isOwnProfile && isAdmin ? profileUser.id : null;
      
      // Call the API to update the active perk
      await authService.updateActivePerk(perkId, null, targetUserId);
      
      // Update the profileUser state
      updateProfileUser({
        ...profileUser,
        activePerk: perkId
      });
      
      // If updating our own profile, refresh the user data in the auth context
      if (isOwnProfile && refreshUser) {
        refreshUser();
      }
      
      // Close the modal
      setIsPerkModalOpen(false);
    } catch (error) {
      console.error('Error updating active perk:', error);
      // Keep the modal open on error
    }
  };
  
  return {
    isPerkModalOpen,
    setIsPerkModalOpen,
    handleOpenPerkModal,
    handlePerkSelect
  };
};

export default PerkManager; 