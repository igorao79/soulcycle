import authCore, { checkDisplayNameUnique, checkUserBan } from './auth/authCore';
import authProfile from './auth/authProfile';
import authAdmin from './auth/authAdmin';

// Тестовые (моковые) данные для разработки - не используются, но оставляем на всякий случай
const mockUserData = {
  id: '123456',
  email: 'test@example.com',
  displayName: 'Тестовый Пользователь',
  role: 'user',
  avatar: 'https://via.placeholder.com/150'
};

// Объединяем все модули в один authService
const authService = {
  // authCore - базовые функции аутентификации
  ...authCore,
  
  // authProfile - функции профиля
  ...authProfile,
  
  // authAdmin - административные функции
  ...authAdmin,
  
  // Явно экспортируем важные функции для совместимости
  checkUserBan,
  checkDisplayNameUnique
};

export default authService; 