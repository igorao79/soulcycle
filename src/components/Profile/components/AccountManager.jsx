import React, { useState } from 'react';
import authService from '../../../services/authService';

const AccountManager = ({ 
  profileUser, 
  updateProfileUser,
  setSuccessMessage,
  refreshUser,
  updateUserDisplayName,
  setDisplayName 
}) => {
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Обработчик для изменения имени пользователя
  const handleChangeName = async (newName, password) => {
    try {
      // Сначала моментально обновляем отображаемое имя в UI
      updateUserDisplayName(newName);
      setDisplayName(newName);
      
      // Затем делаем запрос к API для сохранения имени в базе данных
      await authService.updateDisplayName(newName, password, null);
      
      // Обновляем локальный стейт
      const updatedUser = {
        ...profileUser,
        displayName: newName
      };
      
      updateProfileUser(updatedUser);
      
      setSuccessMessage('Имя пользователя успешно изменено');
      setIsNameModalOpen(false);
      
      // Добавляем задержку перед обновлением пользователя из базы данных
      setTimeout(() => {
        refreshUser();
      }, 1000);
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Ошибка при изменении имени:', error);
      throw error;
    }
  };
  
  // Обработчик для изменения пароля
  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      
      setSuccessMessage('Пароль успешно изменен');
      setIsPasswordModalOpen(false);
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      throw error;
    }
  };
  
  return {
    isNameModalOpen,
    setIsNameModalOpen,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    handleChangeName,
    handleChangePassword
  };
};

export default AccountManager; 