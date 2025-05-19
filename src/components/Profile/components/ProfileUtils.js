import { AVATARS } from '../../../utils/cloudinary';

// Constants
export const PROFILE_AVATARS = [
  { id: 1, name: AVATARS.GUEST, displayName: 'Гость' },
  { id: 2, name: AVATARS.VIVIAN, displayName: 'Вивиан' },
  { id: 3, name: AVATARS.AKITO, displayName: 'Акито' },
  { id: 4, name: AVATARS.LONARIUS, displayName: 'Лонариус' },
  { id: 5, name: AVATARS.FAUST, displayName: 'Фауст' }
];

export const ADMIN_AVATARS = [
  { id: 101, name: AVATARS.IGOR, displayName: 'Игорь', adminOnly: true },
  { id: 102, name: AVATARS.LESYA, displayName: 'Леся', adminOnly: true }
];

// Utility functions
export const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (error) {
    console.error('Ошибка при форматировании даты:', error, dateString);
    return 'Неизвестно';
  }
};

export const formatBanEndTime = (endDate) => {
  if (!endDate) return 'Навсегда';
  
  const end = new Date(endDate);
  const now = new Date();
  
  // Если блокировка истекла, но пользователь все еще заблокирован
  if (end < now) {
    return 'Истек (требуется ручная разблокировка)';
  }
  
  const diff = end - now;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`;
  } else {
    return 'Менее минуты';
  }
};

// Check if the user is an admin
export const isUserAdmin = (user) => {
  return user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
}; 