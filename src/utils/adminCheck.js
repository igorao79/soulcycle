// Единственное место, где определяется email суперадмина
export const SUPER_ADMIN_EMAIL = 'igoraor79@gmail.com';

/**
 * Проверяет, является ли пользователь администратором.
 * Принимает объект с email, perks, activePerk (или active_perk).
 */
export function isAdmin(user) {
  if (!user) return false;
  const email = user.email || '';
  const perks = user.perks || [];
  const activePerk = user.activePerk || user.active_perk || '';
  return (
    email === SUPER_ADMIN_EMAIL ||
    perks.includes('admin') ||
    activePerk === 'admin'
  );
}
