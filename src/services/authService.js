import authCore, { checkDisplayNameUnique, checkUserBan } from './auth/authCore';
import authProfile from './auth/authProfile';
import authAdmin from './auth/authAdmin';


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