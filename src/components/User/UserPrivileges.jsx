import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FaUser, FaCrown, FaStar, FaTag } from 'react-icons/fa';
import './UserPrivileges.css';

const UserPrivileges = ({ userId }) => {
  const [error, setError] = useState(null);
  const [activePrivilege, setActivePrivilege] = useState(null);
  const [availablePrivileges, setAvailablePrivileges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Используем onSnapshot для динамического обновления при изменении данных
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentActivePrivilege = userData.activePrivilege || 'nickname';
        
        const privileges = [];
        
        // Базовый никнейм всегда доступен
        privileges.push({
          id: 'nickname',
          name: 'Пользователь',
          icon: <FaUser />,
          description: 'Показывать ваш никнейм'
        });
        
        // Добавляем остальные привилегии только если они есть
        if (userData.isAdmin) {
          privileges.push({
            id: 'admin',
            name: 'Администратор',
            icon: <FaCrown />,
            description: 'Показывать статус администратора'
          });
        }
        
        if (userData.isEarlyUser) {
          privileges.push({
            id: 'early-user',
            name: 'Ранний пользователь',
            icon: <FaStar />,
            description: 'Показывать статус раннего пользователя'
          });
        }
        
        if (userData.customTitle) {
          privileges.push({
            id: 'custom-title',
            name: userData.customTitle,
            icon: <FaTag />,
            description: 'Показывать ваш особый титул'
          });
        }
        
        setAvailablePrivileges(privileges);

        // Проверяем, доступен ли текущий активный статус
        const isActivePrivilegeAvailable = privileges.some(p => p.id === currentActivePrivilege);
        
        // Если активный статус больше не доступен, сбрасываем его на 'nickname'
        if (!isActivePrivilegeAvailable) {
          updateDoc(doc(db, 'users', userId), {
            activePrivilege: 'nickname'
          }).catch(err => {
            console.error('Error resetting active privilege:', err);
            setError('Не удалось обновить статус');
          });
          setActivePrivilege('nickname');
        } else {
          setActivePrivilege(currentActivePrivilege);
        }
      }
      setIsLoading(false);
    });

    // Очищаем подписку при размонтировании компонента
    return () => unsubscribe();
  }, [userId]);

  const handlePrivilegeChange = async (privilegeId) => {
    // Если выбран тот же статус, что и сейчас активен, ничего не делаем
    if (privilegeId === activePrivilege) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        activePrivilege: privilegeId
      });
    } catch (err) {
      setError('Не удалось обновить статус');
      console.error('Error updating privilege:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Мемоизируем список привилегий, чтобы избежать лишних перерендеров
  const privilegesList = useMemo(() => (
    <div className="privileges-list">
      {availablePrivileges.map((privilege) => (
        <div
          key={privilege.id}
          className={`privilege-item ${activePrivilege === privilege.id ? 'active' : ''}`}
          onClick={() => handlePrivilegeChange(privilege.id)}
          data-id={privilege.id}
        >
          <span className="privilege-icon">{privilege.icon}</span>
          <span className="privilege-name">{privilege.name}</span>
          {activePrivilege === privilege.id && (
            <span className="active-indicator">Активен</span>
          )}
        </div>
      ))}
    </div>
  ), [availablePrivileges, activePrivilege]);

  if (isLoading) {
    return <div className="loading">Загрузка статусов...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (availablePrivileges.length === 0) {
    return <div className="no-data">Нет доступных статусов</div>;
  }

  return (
    <div className="user-privileges">
      <h3>Выбор отображаемого статуса</h3>
      <p className="privilege-description">
        Выберите, какой статус будет отображаться рядом с вашим именем в постах и комментариях.
        В один момент может отображаться только один статус.
      </p>
      
      {privilegesList}
      
      {isSaving && <div className="saving">Сохранение...</div>}
    </div>
  );
};

export default UserPrivileges; 