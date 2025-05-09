import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabaseClient';
import userProfileService from '../../services/userProfileService';
import styles from './AdminPanel.module.scss';
import { FiUsers, FiEdit, FiUser, FiSettings, FiShield, FiMail, FiKey, FiSave, FiX, FiRefreshCw, FiLoader, 
         FiAlertCircle, FiCheckCircle, FiInfo, FiUserX, FiCalendar, FiToggleLeft, FiToggleRight, FiCheck } from 'react-icons/fi';
import { Avatar, AVATARS } from '../../utils/cloudinary';
import ReactDOM from 'react-dom';

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
  
  // Состояния для управления событиями сайта
  const [siteEvents, setSiteEvents] = useState({
    earlyUserPromotion: false,
  });
  const [eventsLoading, setEventsLoading] = useState(false);

  // Проверка и обновление статуса бана пользователей
  const checkAndUpdateBanStatus = async (usersData) => {
    const now = new Date();
    const updatePromises = [];
    
    // Перебираем пользователей и проверяем статус бана
    for (const user of usersData) {
      // Если пользователь забанен и есть дата окончания блокировки
      if (user.is_banned && user.ban_end_at) {
        const banEndDate = new Date(user.ban_end_at);
        
        // Если срок блокировки истек, добавляем к списку на обновление
        if (banEndDate < now) {
          updatePromises.push(
            supabase
              .from('profiles')
              .update({ 
                is_banned: false,
                ban_reason: null,
                ban_end_at: null,
                ban_admin_id: null,
                ban_admin_name: null
              })
              .eq('id', user.id)
          );
          
          // Обновляем статус блокировки в таблице user_bans
          updatePromises.push(
            supabase
              .from('user_bans')
              .update({ is_active: false })
              .eq('user_id', user.id)
              .eq('is_active', true)
          );
          
          // Обновляем пользователя локально
          user.is_banned = false;
          user.ban_reason = null;
          user.ban_end_at = null;
          user.ban_admin_id = null;
          user.ban_admin_name = null;
        }
      }
    }
    
    // Если есть пользователи на обновление, выполняем все обновления
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`Разблокировано пользователей: ${updatePromises.length / 2}`);
    }
    
    return usersData;
  };

  // Функция для прямой загрузки профилей из Supabase
  const loadProfilesDirectly = async () => {
    try {
      setLoading(true);
      console.log('Прямая загрузка профилей из Supabase...');
      
      // Получаем данные профилей напрямую из Supabase
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error('Ошибка при получении профилей:', profilesError);
        setError('Ошибка загрузки профилей пользователей');
        setLoading(false);
        return [];
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('Профили не найдены');
        setUsers([]);
        setLoading(false);
        return [];
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
        console.warn('Не удалось получить данные пользователей из auth схемы:', authError);
        // Продолжаем работу с данными профилей
      }
      
      // Создаем комбинированный список пользователей
      let combinedUsers = profilesData.map(profile => {
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
          is_banned: profile.is_banned || false,
          ban_reason: profile.ban_reason,
          ban_end_at: profile.ban_end_at,
          ban_admin_id: profile.ban_admin_id,
          ban_admin_name: profile.ban_admin_name
        };
      });
      
      // Проверяем и обновляем статус бана для каждого пользователя
      combinedUsers = await checkAndUpdateBanStatus(combinedUsers);
      
      // Обновляем state
      setUsers(combinedUsers);
      setError(null);
      
      console.log('Подготовлен список пользователей:', combinedUsers.length);
      return combinedUsers;
      
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Загрузка списка пользователей
  useEffect(() => {
    loadProfilesDirectly();
    
    // При каждом переходе на страницу администратора обновляем данные
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Страница стала видимой, обновляем данные...');
        loadProfilesDirectly();
      }
    };
    
    // Добавляем слушатель для обновления данных при возвращении на вкладку
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Очищаем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  // Загрузка настроек событий сайта
  useEffect(() => {
    const fetchSiteEvents = async () => {
      try {
        setEventsLoading(true);
        
        // Проверяем существование таблицы site_settings
        try {
          // Получаем настройки событий из таблицы site_settings
          const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .single();
          
          if (error) {
            console.log('Could not retrieve site_settings. Checking if table needs to be created.');
            
            // Если таблица не существует, создаем её через SQL
            const { error: createTableError } = await supabase.rpc('create_site_settings_if_not_exists');
            
            if (createTableError) {
              console.error('Error creating site_settings table via RPC:', createTableError);
              
              // Если не удалось создать через RPC, устанавливаем локальное значение
              setSiteEvents({
                earlyUserPromotion: false
              });
              return;
            }
            
            // Пробуем создать запись
            const { data: newSettings, error: newError } = await supabase
              .from('site_settings')
              .insert({
                early_user_promotion: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .single();
              
            if (newError) {
              console.error('Error creating site settings:', newError);
              setSiteEvents({
                earlyUserPromotion: false
              });
            } else {
              console.log('Successfully created site_settings:', newSettings);
              setSiteEvents({
                earlyUserPromotion: newSettings.early_user_promotion || false
              });
            }
          } else {
            // Устанавливаем состояния из полученных настроек
            setSiteEvents({
              earlyUserPromotion: data.early_user_promotion || false
            });
          }
        } catch (err) {
          console.error('Error handling site_settings:', err);
          // Устанавливаем значения по умолчанию
          setSiteEvents({
            earlyUserPromotion: false
          });
        }
      } finally {
        setEventsLoading(false);
      }
    };
    
    // Загружаем настройки событий
    fetchSiteEvents();
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
  
  // Функция для непосредственного обновления привилегий пользователя
  const updateUserPrivileges = async (userId, newPrivileges) => {
    try {
      console.log(`Начинаем обновление привилегий для пользователя ${userId}`);
      console.log(`Новые привилегии:`, newPrivileges);
      
      // Получаем текущий профиль
      const { data: currentProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (getError) {
        console.error('Ошибка при получении профиля:', getError);
        throw new Error(`Не удалось получить профиль: ${getError.message}`);
      }
      
      console.log('Текущие привилегии:', currentProfile.perks);
      
      // Формируем массив привилегий по одной
      let updatedPerks = ['user']; // Базовая привилегия всегда должна быть
      
      // Проверяем каждую привилегию отдельно и добавляем в массив
      if (newPrivileges.includes('early_user')) {
        updatedPerks.push('early_user');
        console.log('Добавлена привилегия early_user');
      }
      
      if (newPrivileges.includes('sponsor')) {
        updatedPerks.push('sponsor');
        console.log('Добавлена привилегия sponsor');
      }
      
      if (newPrivileges.includes('admin')) {
        updatedPerks.push('admin');
        console.log('Добавлена привилегия admin');
      }
      
      console.log('Итоговый массив привилегий:', updatedPerks);
      
      // Выбираем активную привилегию
      let activePerk = currentProfile.active_perk;
      
      // Если текущая активная привилегия не в новом списке, выбираем первую из новых
      if (!updatedPerks.includes(activePerk)) {
        activePerk = updatedPerks[0];
        console.log('Новая активная привилегия:', activePerk);
      }
      
      // МЕТОД 1: Стандартный вызов UPDATE
      console.log('Обновление привилегий через стандартный UPDATE...');
      const updateResult = await supabase
        .from('profiles')
        .update({
          perks: updatedPerks,
          active_perk: activePerk,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      // Проверяем на ошибки
      if (updateResult.error) {
        console.warn('Стандартное обновление не сработало:', updateResult.error);
        
        // МЕТОД 2: Пробуем вызвать специальную функцию для обновления привилегий
        console.log('Пробуем вызвать RPC функцию admin_update_privileges...');
        try {
          const { error: rpcError } = await supabase.rpc('admin_update_privileges', {
            user_id: userId,
            privileges: updatedPerks
          });
          
          if (rpcError) {
            console.error('Ошибка RPC функции:', rpcError);
            throw new Error(`Ошибка при обновлении привилегий через RPC: ${rpcError.message}`);
          } else {
            console.log('Привилегии успешно обновлены через RPC функцию');
            
            // Теперь обновляем активную привилегию отдельно
            const { error: activeError } = await supabase
              .from('profiles')
              .update({ 
                active_perk: activePerk 
              })
              .eq('id', userId);
              
            if (activeError) {
              console.warn('Не удалось обновить активную привилегию:', activeError);
            }
          }
        } catch (rpcErr) {
          console.error('Ошибка при вызове RPC:', rpcErr);
          
          // МЕТОД 3: Если все методы не сработали, попробуем последний вариант
          console.log('Пытаемся выполнить обходное решение...');
          
          // Этот метод может сработать, если проблема в том, что supabase
          // не может правильно преобразовать массив в JSONB
          const perksJsonString = JSON.stringify(updatedPerks);
          
          // Прямой SQL запрос с использованием нестандартного подхода
          const { error: finalError } = await supabase
            .from('profiles')
            .update({
              // Используем уже готовую строку JSON вместо массива
              raw_perks: perksJsonString,
              // Специальный маркер, который затем будет обработан триггером
              special_update: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (finalError) {
            console.error('Финальная попытка не удалась:', finalError);
            throw finalError;
          } else {
            console.log('Обходное решение сработало');
          }
        }
      } else {
        console.log('Привилегии успешно обновлены через стандартный UPDATE');
      }
      
      // Проверяем что привилегии действительно обновились
      console.log('Проверяем результат обновления...');
      const { data: updatedProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        console.error('Ошибка при проверке обновленного профиля:', checkError);
      } else {
        console.log('Проверка обновленного профиля:', updatedProfile);
        console.log('Обновленные привилегии:', updatedProfile.perks);
        console.log('Ожидаемые привилегии:', updatedPerks);
        
        // Сравнение ожидаемых и полученных привилегий
        if (JSON.stringify(updatedProfile.perks.sort()) !== JSON.stringify(updatedPerks.sort())) {
          console.warn('ВНИМАНИЕ: Привилегии обновились не полностью!');
          console.warn('Полученные:', updatedProfile.perks);
          console.warn('Ожидаемые:', updatedPerks);
        } else {
          console.log('Привилегии обновились корректно');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка в функции updateUserPrivileges:', error);
      throw error;
    }
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      let hasChanges = false;
      
      // Обновление имени пользователя
      if (formData.displayName !== selectedUser.displayName) {
        console.log(`Обновление имени с "${selectedUser.displayName}" на "${formData.displayName}"`);
        
        const { error: nameError } = await supabase
          .from('profiles')
          .update({ display_name: formData.displayName })
          .eq('id', selectedUser.id);
        
        if (nameError) {
          console.error('Ошибка при обновлении имени:', nameError);
          throw new Error(`Ошибка при обновлении имени: ${nameError.message}`);
        }
        
        console.log('Имя пользователя успешно обновлено');
        hasChanges = true;
      }
      
      // Обновляем привилегии, если они изменились
      if (JSON.stringify(formData.perks) !== JSON.stringify(selectedUser.perks)) {
        console.log('Привилегии изменились, обновляем...');
        await updateUserPrivileges(selectedUser.id, formData.perks);
        hasChanges = true;
      }
      
      if (!hasChanges) {
        setTemporaryMessage({
          type: 'info',
          text: 'Нет изменений для сохранения'
        });
        setLoading(false);
        return;
      }
      
      // Загружаем обновленные данные всех профилей
      await loadProfilesDirectly();
      
      // Если текущий пользователь - это пользователь, чьи права были изменены,
      // обновляем данные пользователя без перезагрузки страницы
      if (user && user.id === selectedUser.id) {
        refreshUser();
      }
      
      setTemporaryMessage({
        type: 'success',
        text: 'Профиль пользователя успешно обновлен'
      });
      
      // Сбрасываем режим редактирования через 2 секунды
      setTimeout(() => {
        setIsEditing(false);
        setSelectedUser(null);
      }, 2000);
      
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      setTemporaryMessage({
        type: 'error',
        text: error.message
      });
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
      console.log('Блокировка пользователя:', banDialogUser);
      
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
          case '24h':
            banEndDate.setHours(banEndDate.getHours() + 24);
            break;
          case '7d':
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
      
      console.log('Данные для бана:', banData);
      
      // 1. Сохраняем данные блокировки в таблицу user_bans без select()
      const { error: banError } = await supabase
        .from('user_bans')
        .insert(banData);
        
      if (banError) {
        console.error('Ошибка при создании бана:', banError);
        throw new Error(`Ошибка при сохранении бана: ${banError.message}`);
      }
      
      console.log('Команда создания бана выполнена');
      
      // 2. Отдельным запросом получаем созданную запись о бане
      const { data: banResult, error: getBanError } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', banDialogUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (getBanError) {
        console.error('Ошибка при получении данных бана:', getBanError);
      } else if (banResult && banResult.length > 0) {
        console.log('Данные созданного бана:', banResult[0]);
      }
      
      // 3. Устанавливаем флаг блокировки в профиле пользователя без select()
      const profileUpdateData = { 
        is_banned: true,
        ban_reason: banReason.trim(),
        ban_end_at: banEndDate ? banEndDate.toISOString() : null,
        ban_admin_id: user.id,
        ban_admin_name: user.displayName
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', banDialogUser.id);
        
      if (profileError) {
        console.error('Ошибка при обновлении профиля:', profileError);
      } else {
        console.log('Команда обновления профиля при бане выполнена');
      }
      
      // 4. Отдельным запросом получаем обновленный профиль
      const { data: updatedProfile, error: getProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', banDialogUser.id)
        .single();
      
      if (getProfileError) {
        console.error('Ошибка при получении обновленного профиля:', getProfileError);
      } else {
        console.log('Обновленный профиль пользователя:', updatedProfile);
      }
      
      // 5. Загружаем обновленные данные всех профилей
      await loadProfilesDirectly();
      
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
      console.log("Попытка разблокировки пользователя:", userId);
      
      // Получаем данные пользователя для сообщения
      const userData = users.find(u => u.id === userId);
      
      // 1. Обновляем записи в таблице user_bans - БЕЗ select()
      const { error: banError } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);
        
      if (banError) {
        console.error("Ошибка при обновлении бана:", banError);
        throw new Error(`Ошибка при обновлении блокировки: ${banError.message}`);
      }
      
      console.log("Команда разблокировки выполнена");
      
      // 2. Сбрасываем флаги блокировки в профиле - БЕЗ select()
      const profileUpdateData = { 
        is_banned: false,
        ban_reason: null,
        ban_end_at: null,
        ban_admin_id: null,
        ban_admin_name: null
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);
        
      if (profileError) {
        console.error("Ошибка при обновлении профиля:", profileError);
        throw new Error(`Ошибка при обновлении профиля: ${profileError.message}`);
      }
      
      console.log("Команда обновления профиля при разблокировке выполнена");
      
      // 3. Получаем обновленный профиль отдельным запросом для проверки
      const { data: updatedProfile, error: getProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (getProfileError) {
        console.error("Ошибка при получении обновленного профиля:", getProfileError);
      } else {
        console.log("Обновленный профиль пользователя после разблокировки:", updatedProfile);
      }
      
      // 4. Обновляем список пользователей напрямую
      await loadProfilesDirectly();
      
      // Показываем сообщение об успешной разблокировке
      setTemporaryMessage({
        type: 'success',
        text: `Пользователь ${userData?.displayName || 'выбранный'} успешно разблокирован`
      });
      
      // Закрываем диалог, если он открыт
      if (showBanDialog) {
        setShowBanDialog(false);
        setBanDialogUser(null);
      }
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
  
  // Функция для включения/выключения событий сайта
  const toggleSiteEvent = async (eventName) => {
    try {
      // Проверяем права администратора
      const isUserAdmin = user && (
        user.email === 'igoraor79@gmail.com' || 
        user.perks?.includes('admin') || 
        user.activePerk === 'admin'
      );
      
      if (!isUserAdmin) {
        setTemporaryMessage({
          type: 'error',
          text: 'Только администраторы могут управлять событиями сайта'
        });
        return;
      }
      
      setEventsLoading(true);
      
      // Переключаем состояние нужного события
      const newValue = !siteEvents[eventName];
      
      // Форматируем название события для БД (camelCase → snake_case)
      let dbEventName = '';
      
      if (eventName === 'earlyUserPromotion') {
        dbEventName = 'early_user_promotion';
      } else {
        dbEventName = eventName.replace(/([A-Z])/g, '_$1').toLowerCase();
      }
      
      // Обновляем в БД
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          [dbEventName]: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('site_settings').select('id').single()).data.id);
      
      if (error) {
        console.error(`Ошибка при обновлении настройки ${eventName}:`, error);
        
        // Пробуем создать таблицу, если её нет
        console.log('Пробуем создать таблицу site_settings...');
        
        try {
          // Создаем таблицу через RPC
          await supabase.rpc('create_site_settings_if_not_exists');
          
          // Повторяем попытку обновления
          const { error: updateError } = await supabase
            .from('site_settings')
            .update({ 
              [dbEventName]: newValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', (await supabase.from('site_settings').select('id').single()).data.id);
          
          if (updateError) {
            throw new Error(`Не удалось обновить настройку: ${updateError.message}`);
          }
        } catch (createError) {
          throw new Error(`Не удалось создать или обновить таблицу настроек: ${createError.message}`);
        }
      }
      
      // Обновляем локальное состояние
      setSiteEvents(prev => ({
        ...prev,
        [eventName]: newValue
      }));
      
      setTemporaryMessage({
        type: 'success',
        text: `Событие "${eventName === 'earlyUserPromotion' ? 'Ранний пользователь' : eventName}" ${newValue ? 'включено' : 'отключено'}`
      });
    } catch (error) {
      console.error('Ошибка при переключении события:', error);
      setTemporaryMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setEventsLoading(false);
    }
  };
  
  // Если пользователь не админ, не рендерим компонент
  if (!user || !isAdmin) {
    return null;
  }
  
  // Add this before returning the main component JSX
  // Replace the existing ban dialog modal with this implementation
  const renderBanDialog = () => {
    if (!showBanDialog) return null;

    return ReactDOM.createPortal(
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
                    <option value="24h">24 часа</option>
                    <option value="7d">7 дней</option>
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
      </div>,
      document.getElementById('modal-root') || document.body
    );
  };
  
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
      
      {/* Секция управления событиями сайта */}
      <div className={styles.eventsSection}>
        <h2>
          <FiCalendar size={18} /> События сайта
        </h2>
        
        {eventsLoading ? (
          <div className={styles.loader}>
            <FiLoader size={24} /> Загрузка настроек событий...
          </div>
        ) : (
          <div className={styles.eventsList}>
            <div className={styles.eventItem}>
              <div className={styles.eventInfo}>
                <h3>Привилегия "Ранний пользователь"</h3>
                <p>Автоматически выдает привилегию "Ранний пользователь" всем новым пользователям при регистрации.</p>
                <p><strong>Статус:</strong> {siteEvents.earlyUserPromotion ? 'Активно' : 'Неактивно'}</p>
              </div>
              <button 
                className={`${styles.eventToggle} ${siteEvents.earlyUserPromotion ? styles.active : ''}`}
                onClick={() => toggleSiteEvent('earlyUserPromotion')}
                disabled={eventsLoading}
              >
                {siteEvents.earlyUserPromotion ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                {siteEvents.earlyUserPromotion ? 'Выключить' : 'Включить'}
              </button>
            </div>
          </div>
        )}
      </div>
      
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
                            <Avatar 
                              avatar={userItem.avatar || AVATARS.GUEST}
                              alt={userItem.displayName}
                              size={60}
                            />
                          </div>
                        </td>
                        <td>
                          <div className={styles.userInfo}>
                            <span 
                              className={styles.userName}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${userItem.id}`);
                              }}
                              style={{ 
                                cursor: 'pointer', 
                                textDecoration: 'underline',
                                color: 'var(--accent)'
                              }}
                              title="Перейти к профилю пользователя"
                            >
                              {userItem.displayName}
                            </span>
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
                                
                                // Разрешаем редактирование только если это не защищенный аккаунт
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
                                
                                // Если пользователь уже заблокирован - разблокируем
                                if (userItem.is_banned) {
                                  handleUnbanUser(userItem.id);
                                } else {
                                  // Иначе показываем диалог блокировки
                                  setBanDialogUser(userItem);
                                  setShowBanDialog(true);
                                }
                              }}
                              disabled={userItem.email === 'igoraor79@gmail.com'}
                              title={userItem.is_banned ? "Разблокировать пользователя" : "Заблокировать пользователя"}
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
      
      {renderBanDialog()}
    </div>
  );
};

export default AdminPanel; 