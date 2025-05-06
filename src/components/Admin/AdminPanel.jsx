import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabaseClient';
import userProfileService from '../../services/userProfileService';
import styles from './AdminPanel.module.scss';
import { FiUsers, FiEdit, FiUser, FiSettings, FiShield, FiMail, FiKey, FiSave, FiX, FiRefreshCw, FiLoader, 
         FiAlertCircle, FiCheckCircle, FiInfo, FiUserX } from 'react-icons/fi';

const AdminPanel = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    perks: []
  });
  const [message, setMessage] = useState(null);
  const messageTimeoutRef = useRef(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banDialogUser, setBanDialogUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [banLoading, setBanLoading] = useState(false);

  // Проверка, является ли пользователь администратором
  useEffect(() => {
    console.log('User auth check:', { 
      user: user, 
      email: user?.email,
      perks: user?.perks,
      activePerk: user?.activePerk,
      isAdmin: user && (
        user.email === 'igoraor79@gmail.com' || 
        user.perks?.includes('admin') || 
        user.activePerk === 'admin'
      )
    });

    // Добавляем проверку загрузки и null для предотвращения редиректа во время загрузки данных
    if (user === null) {
      // Пользователь загружается, ничего не делаем пока
      return;
    }
    
    const isUserAdmin = user && (
      user.email === 'igoraor79@gmail.com' || 
      user.perks?.includes('admin') || 
      user.activePerk === 'admin'
    );
    
    if (!isUserAdmin) {
      console.log('Redirecting non-admin user to home page');
      navigate('/');
    }
  }, [user, navigate]);

  // Загрузка списка пользователей
  useEffect(() => {
    // Создаем функцию для загрузки пользователей
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Загружаем свежие данные пользователей из Supabase...');
        
        // Получаем данные профилей напрямую из Supabase
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (profilesError) {
          throw new Error(`Ошибка при получении профилей: ${profilesError.message}`);
        }
        
        if (!profilesData || profilesData.length === 0) {
          console.log('Профили не найдены');
          setUsers([]);
          setLoading(false);
          return;
        }
        
        console.log('Загружено профилей:', profilesData.length);
        
        // Получаем дополнительные данные из auth.users (если имеем доступ)
        let authUsers = [];
        
        try {
          // Пробуем получить пользователей через RPC функцию
          const { data, error } = await supabase.rpc('admin_get_users');
          
          if (!error && data) {
            authUsers = data;
            console.log('Загружено данных из auth.users:', authUsers.length);
          }
        } catch (authError) {
          console.error('Не удалось получить данные пользователей из auth схемы:', authError);
          // Продолжаем работу с данными профилей
        }
        
        // Создаем комбинированный список пользователей
        const combinedUsers = profilesData.map(profile => {
          // Ищем соответствующие данные в auth.users
          const authUser = authUsers.find(au => au.id === profile.id);
          
          // Получаем метаданные пользователя, если они есть
          const userMetadata = authUser?.raw_user_meta_data || {};
          
          return {
            id: profile.id,
            displayName: profile.display_name || userMetadata.display_name || 'Пользователь',
            email: authUser?.email || profile.email || 'Нет email',
            perks: profile.perks || ['user'],
            activePerk: profile.active_perk || 'user',
            avatar: profile.avatar || userMetadata.avatar,
            createdAt: authUser?.created_at || profile.created_at || new Date().toISOString(),
            is_banned: profile.is_banned || false
          };
        });
        
        console.log('Подготовлен список пользователей:', combinedUsers.length);
        setUsers(combinedUsers);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке пользователей:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Вызываем функцию загрузки при первом рендере и когда пользователь входит в админ-панель
    fetchUsers();
    
    // При каждом переходе на страницу администратора обновляем данные
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Страница стала видимой, обновляем данные...');
        fetchUsers();
      }
    };
    
    // Добавляем слушатель для обновления данных при возвращении на вкладку
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Очищаем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Обработчик выбора пользователя для редактирования
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName || '',
      email: user.email || '',
      password: '',
      perks: user.perks || ['user']
    });
    setIsEditing(true);
  };
  
  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Обработчик изменения привилегий
  const handlePerkChange = (perk) => {
    // Если это пользовательская привилегия, её нельзя убрать
    if (perk === 'user') return;
    
    const newPerks = formData.perks.includes(perk)
      ? formData.perks.filter(p => p !== perk)
      : [...formData.perks, perk];
      
    // Убедимся, что 'user' всегда присутствует в перках
    if (!newPerks.includes('user')) {
      newPerks.push('user');
    }
    
    setFormData({
      ...formData,
      perks: newPerks
    });
  };
  
  // Функция, которая напрямую обновляет профиль в базе данных и в auth.users
  const updateProfileDirectly = async (userId, displayName) => {
    console.log(`ПРЯМОЕ ОБНОВЛЕНИЕ ПРОФИЛЯ: userId=${userId}, displayName=${displayName}`);
    
    try {
      // Получаем текущие данные пользователя для проверки
      const { data: oldData, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (getError) {
        console.error('ОШИБКА ПРИ ПОЛУЧЕНИИ ДАННЫХ ПРОФИЛЯ:', getError);
        return { success: false, error: getError };
      }
      
      console.log('ТЕКУЩИЕ ДАННЫЕ ПРОФИЛЯ:', oldData);
      
      // 1. Прямое обновление профиля в таблице profiles
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userId);
      
      if (error) {
        console.error('ОШИБКА ПРИ ОБНОВЛЕНИИ ПРОФИЛЯ:', error);
        return { success: false, error };
      }
      
      // 2. Обновление метаданных пользователя в auth.users через специальную RPC-функцию
      // Примечание: эта функция должна быть создана в Supabase
      try {
        const { error: rpcError } = await supabase
          .rpc('admin_update_user_metadata', { 
            user_id: userId, 
            metadata_key: 'display_name', 
            metadata_value: displayName 
          });
          
        if (rpcError) {
          console.warn('ПРЕДУПРЕЖДЕНИЕ: Не удалось обновить метаданные пользователя:', rpcError);
          // Продолжаем выполнение, так как обновление profiles уже выполнено
        }
      } catch (rpcError) {
        console.warn('ПРЕДУПРЕЖДЕНИЕ: Ошибка при вызове RPC для обновления метаданных:', rpcError);
        // Продолжаем выполнение, так как обновление profiles уже выполнено
      }
      
      // 3. Проверяем, что обновление действительно произошло
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (verifyError) {
        console.error('ОШИБКА ПРИ ПРОВЕРКЕ ОБНОВЛЕНИЯ:', verifyError);
        return { success: false, error: verifyError };
      }
      
      console.log('ПРОВЕРКА ОБНОВЛЕНИЯ:', verifyData);
      
      if (verifyData.display_name !== displayName) {
        console.error(`ДАННЫЕ НЕ ОБНОВИЛИСЬ: ${verifyData.display_name} !== ${displayName}`);
        return { success: false, error: new Error('Данные не обновились') };
      }
      
      console.log('ОБНОВЛЕНИЕ УСПЕШНО!');
      return { success: true, data: verifyData };
    } catch (e) {
      console.error('НЕОБРАБОТАННАЯ ОШИБКА:', e);
      return { success: false, error: e };
    }
  };
  
  // После успешного обновления данных, обновляем список пользователей с принудительным обновлением
  const refreshUsersList = async () => {
    try {
      console.log('Принудительное обновление списка пользователей...');
      
      // Установка небольшой задержки, чтобы БД успела обновиться
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Получаем обновленные данные профилей
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error('Ошибка при обновлении списка профилей:', profilesError);
        return;
      }
      
      console.log('Получены свежие данные профилей из БД:', profilesData);
      
      // Используем только что полученные данные для обновления списка
      const updatedUsers = profilesData.map(profile => ({
        id: profile.id,
        displayName: profile.display_name || 'Пользователь',
        email: profile.email || 'Email не указан',
        perks: profile.perks || ['user'],
        activePerk: profile.active_perk || 'user',
        avatar: profile.avatar,
        createdAt: profile.created_at || new Date().toISOString(),
        is_banned: profile.is_banned || false
      }));
      
      console.log('Обновляем список пользователей на:', updatedUsers);
      
      // Полностью заменяем список пользователей новыми данными
      setUsers([...updatedUsers]);
      
      // Если текущий выбранный пользователь был обновлен, обновляем и его
      if (selectedUser) {
        const updatedSelectedUser = updatedUsers.find(u => u.id === selectedUser.id);
        if (updatedSelectedUser) {
          console.log('Обновляем выбранного пользователя:', updatedSelectedUser);
          setSelectedUser(updatedSelectedUser);
        }
      }
      
    } catch (err) {
      console.error('Ошибка при обновлении списка пользователей:', err);
    }
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Прямое обновление имени пользователя
      if (formData.displayName !== selectedUser.displayName) {
        console.log('Начинаем обновление имени пользователя');
        
        const result = await updateProfileDirectly(selectedUser.id, formData.displayName);
        
        if (result.success) {
          console.log('Имя пользователя успешно обновлено!');
          
          // Обновляем список в интерфейсе
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === selectedUser.id
              ? { ...user, displayName: formData.displayName }
              : user
          ));
          
          // Обновляем весь список
          refreshUsersList();
          
          setTemporaryMessage({
            type: 'success',
            text: 'Имя пользователя успешно обновлено!'
          });
        } else {
          console.error('Ошибка при обновлении имени:', result.error);
          setTemporaryMessage({
            type: 'error',
            text: `Ошибка обновления: ${result.error.message}`
          });
          setLoading(false);
          return;
        }
      }
      
      // Обновляем привилегии, если они изменились
      if (JSON.stringify(formData.perks) !== JSON.stringify(selectedUser.perks)) {
        console.log('Обновляем привилегии пользователя:', formData.perks);
        
        const perksUpdate = {
          perks: formData.perks
        };
        
        // Если active_perk больше не существует в perks, обновляем его
        if (!formData.perks.includes(selectedUser.activePerk)) {
          perksUpdate.active_perk = formData.perks[0];
        }
        
        try {
          const { error: perksError } = await supabase
            .from('profiles')
            .update(perksUpdate)
            .eq('id', selectedUser.id);
            
          if (perksError) {
            throw new Error(`Ошибка при обновлении привилегий: ${perksError.message}`);
          }
          
          console.log('Привилегии пользователя успешно обновлены');
          
          // Обновляем список пользователей
          refreshUsersList();
          
          // Если текущий пользователь - это пользователь, чьи права были изменены,
          // обновляем данные пользователя без перезагрузки страницы
          if (user && user.id === selectedUser.id) {
            refreshUser();
          }
          
          setTemporaryMessage({
            type: 'success',
            text: 'Привилегии пользователя успешно обновлены'
          });
        } catch (perksError) {
          console.error('Ошибка при обновлении привилегий:', perksError);
          setTemporaryMessage({
            type: 'error',
            text: perksError.message
          });
        }
      }
      
      // Если изменений не было
      if (formData.displayName === selectedUser.displayName && 
          JSON.stringify(formData.perks) === JSON.stringify(selectedUser.perks)) {
        setTemporaryMessage({
          type: 'info',
          text: 'Нет изменений для сохранения'
        });
      }
      
      // Сбрасываем режим редактирования через 2 секунды
      setTimeout(() => {
        setIsEditing(false);
        setSelectedUser(null);
        setTemporaryMessage(null);
      }, 2000);
      
    } finally {
      setLoading(false);
    }
  };
  
  // Добавляем функцию для сброса пароля через email
  const handleResetPasswordByEmail = async (email) => {
    try {
      setLoading(true);
      setTemporaryMessage({
        type: 'info',
        text: `Отправка ссылки для сброса пароля на ${email}...`
      });
      
      // Определяем корректный URL для перенаправления
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/reset-password`;
      
      console.log('Отправка ссылки для сброса пароля с перенаправлением на:', redirectTo);
      
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
      console.error('Ошибка при сбросе пароля:', err);
      setTemporaryMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для отображения названия привилегии
  const getPerkDisplayName = (perk) => {
    switch (perk) {
      case 'user': return 'Пользователь';
      case 'early_user': return 'Ранний пользователь';
      case 'sponsor': return 'Спонсор';
      case 'admin': return 'Администратор';
      default: return perk;
    }
  };
  
  // Маркер, который указывает, является ли пользователь администратором
  const isAdmin = user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);
  
  // Функция для установки сообщения с автоматическим очищением
  const setTemporaryMessage = (messageObj, duration = 3000) => {
    // Очищаем предыдущий таймер, если есть
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    // Устанавливаем новое сообщение
    setMessage(messageObj);
    
    // Создаем новый таймер для очистки сообщения
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
    }, duration);
  };
  
  // Обработчик блокировки пользователя
  const handleBanUser = async (e) => {
    if (e) e.preventDefault();
    
    if (!banDialogUser || !banReason.trim() || !banDuration) return;
    
    try {
      setBanLoading(true);
      
      // Рассчитываем время окончания блокировки
      let banEndDate = null;
      
      if (banDuration !== 'permanent') {
        banEndDate = new Date();
        
        // Добавляем соответствующее время в зависимости от выбранной длительности
        switch (banDuration) {
          case '30m':
            banEndDate.setMinutes(banEndDate.getMinutes() + 30);
            break;
          case '2h':
            banEndDate.setHours(banEndDate.getHours() + 2);
            break;
          case '6h':
            banEndDate.setHours(banEndDate.getHours() + 6);
            break;
          case '12h':
            banEndDate.setHours(banEndDate.getHours() + 12);
            break;
          case '1d':
            banEndDate.setDate(banEndDate.getDate() + 1);
            break;
          case '3d':
            banEndDate.setDate(banEndDate.getDate() + 3);
            break;
          case '1w':
            banEndDate.setDate(banEndDate.getDate() + 7);
            break;
          default:
            banEndDate = null;
        }
      }
      
      // Создаем запись о блокировке
      const banData = {
        user_id: banDialogUser.id,
        admin_id: user.id,
        admin_name: user.displayName,
        reason: banReason.trim(),
        created_at: new Date().toISOString(),
        end_at: banEndDate ? banEndDate.toISOString() : null,
        is_active: true,
        ban_type: banDuration
      };
      
      // Сохраняем данные блокировки в таблицу user_bans
      const { error: banError } = await supabase
        .from('user_bans')
        .insert(banData);
        
      if (banError) {
        throw new Error(`Ошибка при создании блокировки: ${banError.message}`);
      }
      
      // Устанавливаем флаг блокировки в профиле пользователя
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          ban_reason: banReason.trim(),
          ban_end_at: banEndDate ? banEndDate.toISOString() : null,
          ban_admin_id: user.id,
          ban_admin_name: user.displayName
        })
        .eq('id', banDialogUser.id);
        
      if (profileError) {
        throw new Error(`Ошибка при обновлении профиля: ${profileError.message}`);
      }
      
      // Обновляем список пользователей
      await refreshUsersList();
      
      // Показываем сообщение об успешной блокировке
      setTemporaryMessage({
        type: 'success',
        text: `Пользователь ${banDialogUser.displayName} успешно заблокирован`
      });
      
      // Закрываем диалог
      setShowBanDialog(false);
      setBanReason('');
      setBanDuration('');
      setBanDialogUser(null);
      
    } catch (error) {
      console.error('Ошибка при блокировке пользователя:', error);
      setTemporaryMessage({
        type: 'error',
        text: `Ошибка при блокировке: ${error.message}`
      });
    } finally {
      setBanLoading(false);
    }
  };
  
  // Обработчик разблокировки пользователя
  const handleUnbanUser = async (userId) => {
    if (!userId) return;
    
    try {
      setBanLoading(true);
      
      // Обновляем статус блокировки в таблице user_bans
      const { error: banError } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);
        
      if (banError) {
        throw new Error(`Ошибка при обновлении блокировки: ${banError.message}`);
      }
      
      // Сбрасываем флаг блокировки в профиле пользователя
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_banned: false,
          ban_reason: null,
          ban_end_at: null,
          ban_admin_id: null,
          ban_admin_name: null
        })
        .eq('id', userId);
        
      if (profileError) {
        throw new Error(`Ошибка при обновлении профиля: ${profileError.message}`);
      }
      
      // Обновляем список пользователей
      await refreshUsersList();
      
      // Показываем сообщение об успешной разблокировке
      setTemporaryMessage({
        type: 'success',
        text: `Пользователь ${banDialogUser.displayName} успешно разблокирован`
      });
      
      // Закрываем диалог
      setShowBanDialog(false);
      setBanDialogUser(null);
      
    } catch (error) {
      console.error('Ошибка при разблокировке пользователя:', error);
      setTemporaryMessage({
        type: 'error',
        text: `Ошибка при разблокировке: ${error.message}`
      });
    } finally {
      setBanLoading(false);
    }
  };
  
  // Если пользователь не админ, не рендерим компонент
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className={styles.adminPanel}>
      <h1 className={styles.title}>
        <FiSettings size={24} /> Панель администратора
      </h1>
      
      {error && (
        <div className={styles.error}>
          <FiAlertCircle size={20} style={{ marginRight: '10px' }} /> {error}
        </div>
      )}
      
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' && <FiCheckCircle size={20} style={{ marginRight: '10px' }} />}
          {message.type === 'error' && <FiAlertCircle size={20} style={{ marginRight: '10px' }} />}
          {message.type === 'info' && <FiInfo size={20} style={{ marginRight: '10px' }} />}
          {message.text}
        </div>
      )}
      
      <div className={styles.content}>
        <div className={styles.usersSection}>
          <h2>
            <FiUsers size={18} /> Список пользователей
          </h2>
          
          {loading ? (
            <div className={styles.loader}>
              <FiLoader size={24} /> Загрузка пользователей...
            </div>
          ) : (
            <div className={styles.usersList}>
              {users.length === 0 ? (
                <div className={styles.emptyList}>
                  Пользователи не найдены
                </div>
              ) : (
                <table>
                  <tbody>
                    {users.map((userItem) => (
                      <tr 
                        key={userItem.id} 
                        className={
                          selectedUser && selectedUser.id === userItem.id
                            ? styles.selectedUser
                            : ''
                        }
                        onClick={() => {
                          // Проверяем, не является ли пользователь защищенным
                          if (userItem.email === 'igoraor79@gmail.com' && user.email !== 'igoraor79@gmail.com') {
                            setTemporaryMessage({
                              type: 'warning',
                              text: 'Этот пользователь защищен от редактирования другими администраторами'
                            });
                            return;
                          }
                          handleSelectUser(userItem);
                        }}
                      >
                        <td>
                          <div className={styles.userAvatar}>
                            <img 
                              src={userItem.avatar || 'https://via.placeholder.com/40'} 
                              alt={userItem.displayName}
                            />
                          </div>
                        </td>
                        <td>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{userItem.displayName}</span>
                            <span className={styles.userEmail}>{userItem.email}</span>
                            {userItem.email === 'igoraor79@gmail.com' && (
                              <span className={styles.protectedUser}>Защищенный аккаунт</span>
                            )}
                            {userItem.is_banned && (
                              <span className={styles.bannedUser}>Заблокирован</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {userItem.activePerk && (
                            <span className={`${styles.perk} ${styles[userItem.activePerk]}`}>
                              {userItem.activePerk === 'early_user' && 'Ранний пользователь'}
                              {userItem.activePerk === 'sponsor' && 'Спонсор'}
                              {userItem.activePerk === 'admin' && 'Администратор'}
                              {userItem.activePerk === 'user' && 'Пользователь'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.userActions}>
                            <button 
                              className={styles.editUserButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                // Разрешаем редактирование только если это сам igorao079
                                if (userItem.email === 'igoraor79@gmail.com' && user.email !== 'igoraor79@gmail.com') {
                                  setTemporaryMessage({
                                    type: 'warning',
                                    text: 'Этот пользователь защищен от редактирования другими администраторами'
                                  });
                                  return;
                                }
                                
                                handleSelectUser(userItem);
                              }}
                              disabled={userItem.email === 'igoraor79@gmail.com' && user.email !== 'igoraor79@gmail.com'}
                            >
                              <FiEdit size={16} />
                            </button>
                            
                            <button 
                              className={styles.banUserButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                // Защищаем аккаунт администратора от блокировки
                                if (userItem.email === 'igoraor79@gmail.com') {
                                  setTemporaryMessage({
                                    type: 'warning',
                                    text: 'Этот пользователь защищен от блокировки'
                                  });
                                  return;
                                }
                                
                                // Отображаем диалог блокировки
                                setBanDialogUser(userItem);
                                setShowBanDialog(true);
                              }}
                              disabled={userItem.email === 'igoraor79@gmail.com'}
                              title={userItem.is_banned ? "Управление блокировкой" : "Заблокировать пользователя"}
                            >
                              <FiUserX size={16} color={userItem.is_banned ? "#e74c3c" : "#666"} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.editSection}>
          <h2>
            <FiEdit size={18} /> Редактирование профиля
          </h2>
          
          {selectedUser && isEditing ? (
            <form className={styles.editForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="displayName">
                  <FiUser size={18} /> Отображаемое имя:
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Введите имя пользователя"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">
                  <FiMail size={18} /> Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Введите email"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">
                  <FiKey size={18} /> Пароль (оставьте пустым, чтобы не менять):
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Новый пароль"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>
                  <FiShield size={18} /> Привилегии:
                </label>
                <div className={styles.perksOptions}>
                  <div className={`${styles.perkOption} ${styles.basePerk}`}>
                    <input
                      type="checkbox"
                      id="perk-user"
                      checked={true}
                      disabled={true}
                      readOnly
                    />
                    <label htmlFor="perk-user" className={styles.baseLabel}>
                      Пользователь <span className={styles.baseNote}>(базовая привилегия)</span>
                    </label>
                  </div>
                  
                  <div className={styles.perkOption}>
                    <input
                      type="checkbox"
                      id="perk-early_user"
                      checked={formData.perks.includes('early_user')}
                      onChange={() => handlePerkChange('early_user')}
                    />
                    <label htmlFor="perk-early_user">
                      Ранний пользователь
                    </label>
                  </div>
                  
                  <div className={styles.perkOption}>
                    <input
                      type="checkbox"
                      id="perk-sponsor"
                      checked={formData.perks.includes('sponsor')}
                      onChange={() => handlePerkChange('sponsor')}
                    />
                    <label htmlFor="perk-sponsor">
                      Спонсор
                    </label>
                  </div>
                  
                  <div className={styles.perkOption}>
                    <input
                      type="checkbox"
                      id="perk-admin"
                      checked={formData.perks.includes('admin')}
                      onChange={() => handlePerkChange('admin')}
                    />
                    <label htmlFor="perk-admin">
                      Администратор
                    </label>
                  </div>
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsEditing(false)}
                >
                  <FiX size={18} /> Отмена
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? <FiLoader size={18} /> : <FiSave size={18} />} Сохранить
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.noUserSelected}>
              {loading ? (
                <div className={styles.loader}>
                  <FiLoader size={24} /> Загрузка данных...
                </div>
              ) : (
                <p>
                  <FiUser size={64} />
                  <br />
                  Выберите пользователя из списка слева, чтобы редактировать
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Диалог блокировки пользователя */}
      {showBanDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.banDialog}>
            <div className={styles.banDialogHeader}>
              <h3>{banDialogUser.is_banned ? "Управление блокировкой" : "Блокировка пользователя"}</h3>
              <button 
                className={styles.closeButton} 
                onClick={() => setShowBanDialog(false)}
              >
                <FiX />
              </button>
            </div>
            
            <div className={styles.banDialogContent}>
              {banDialogUser.is_banned ? (
                <div className={styles.currentBanInfo}>
                  <p>Пользователь <strong>{banDialogUser.displayName}</strong> в настоящее время заблокирован.</p>
                  <button 
                    className={styles.unbanButton}
                    onClick={() => handleUnbanUser(banDialogUser.id)}
                    disabled={banLoading}
                  >
                    {banLoading ? <FiLoader size={16} /> : <FiCheck size={16} />} Разблокировать пользователя
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBanUser}>
                  <div className={styles.formGroup}>
                    <label htmlFor="banReason">Причина блокировки:</label>
                    <textarea
                      id="banReason"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Укажите причину блокировки пользователя"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="banDuration">Длительность блокировки:</label>
                    <select
                      id="banDuration"
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      required
                    >
                      <option value="">Выберите длительность</option>
                      <option value="30m">30 минут</option>
                      <option value="2h">2 часа</option>
                      <option value="6h">6 часов</option>
                      <option value="12h">12 часов</option>
                      <option value="1d">1 день</option>
                      <option value="3d">3 дня</option>
                      <option value="1w">1 неделя</option>
                      <option value="permanent">Навсегда</option>
                    </select>
                  </div>
                  
                  <div className={styles.banDialogActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setShowBanDialog(false)}
                      disabled={banLoading}
                    >
                      <FiX size={16} /> Отмена
                    </button>
                    <button
                      type="submit"
                      className={styles.banButton}
                      disabled={!banReason.trim() || !banDuration || banLoading}
                    >
                      {banLoading ? <FiLoader size={16} /> : <FiUserX size={16} />} Заблокировать
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 