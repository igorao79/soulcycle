import supabase from '../supabaseClient';
import userProfileService, { emitEvent } from '../userProfileService';
import { checkDisplayNameUnique } from './authCore';
import { triggerUserUpdate } from '../../contexts/AuthContext';

const authAdmin = {
  // Функция для создания SQL-функции синхронизации имени пользователя
  async createSyncDisplayNameFunction() {
    try {
      // Этот SQL создает хранимую процедуру, которая будет обновлять метаданные пользователя
      const { error } = await supabase.rpc('create_sync_display_name_function', {
        sql_function: `
          CREATE OR REPLACE FUNCTION sync_user_display_name(
            admin_id UUID,            -- ID администратора, выполняющего операцию
            target_user_id UUID,      -- ID целевого пользователя
            new_display_name TEXT     -- Новое отображаемое имя
          )
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            admin_email TEXT;
            admin_perks JSONB;
            admin_active_perk TEXT;
            is_admin BOOLEAN;
            current_metadata JSONB;
            updated_metadata JSONB;
            old_display_name TEXT;
          BEGIN
            -- 1. Проверяем права администратора
            SELECT email, perks, active_perk INTO admin_email, admin_perks, admin_active_perk
            FROM profiles
            WHERE id = admin_id;
            
            is_admin := (admin_email = 'igoraor79@gmail.com' OR 
                        admin_perks ? 'admin' OR 
                        admin_active_perk = 'admin');
            
            IF NOT is_admin THEN
              RETURN jsonb_build_object(
                'success', false,
                'message', 'Недостаточно прав для изменения имени другого пользователя'
              );
            END IF;
            
            -- 2. Получаем текущее отображаемое имя
            SELECT display_name INTO old_display_name 
            FROM profiles 
            WHERE id = target_user_id;
            
            -- 3. Обновляем имя в таблице profiles
            UPDATE profiles 
            SET display_name = new_display_name,
                updated_at = NOW()
            WHERE id = target_user_id;
            
            -- 4. Получаем текущие метаданные из auth.users
            SELECT raw_user_meta_data INTO current_metadata 
            FROM auth.users 
            WHERE id = target_user_id;
            
            -- 5. Обновляем метаданные пользователя в auth.users
            updated_metadata := current_metadata || jsonb_build_object('display_name', new_display_name);
            
            UPDATE auth.users
            SET raw_user_meta_data = updated_metadata
            WHERE id = target_user_id;
            
            -- 6. Возвращаем результат операции
            RETURN jsonb_build_object(
              'success', true,
              'message', 'Имя пользователя успешно обновлено в профиле и метаданных',
              'old_display_name', old_display_name,
              'new_display_name', new_display_name,
              'updated_metadata', updated_metadata
            );
          EXCEPTION
            WHEN OTHERS THEN
              RETURN jsonb_build_object(
                'success', false,
                'message', 'Ошибка при обновлении имени: ' || SQLERRM
              );
          END;
          $$ ;
          
          -- Предоставляем права на выполнение функции аутентифицированным пользователям
          GRANT EXECUTE ON FUNCTION sync_user_display_name(UUID, UUID, TEXT) TO authenticated;
        `
      });
      
      if (error) {
        console.error('Ошибка при создании функции синхронизации:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при создании функции синхронизации:', error);
      return false;
    }
  },

  // Обновление данных пользователя администратором (без проверки пароля)
  async adminUpdateDisplayName(targetUserId, newDisplayName, onUpdateComplete = null) {
    try {
      // Получаем текущую сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Администратор не авторизован');
      }
      
      const adminId = sessionData.session.user.id;
      const adminEmail = sessionData.session.user.email;
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = adminEmail === 'igoraor79@gmail.com' || 
                      sessionData.session.user.user_metadata?.perks?.includes('admin') || 
                      sessionData.session.user.user_metadata?.active_perk === 'admin';
                     
      if (!isAdmin) {
        throw new Error('Недостаточно прав для изменения имени другого пользователя');
      }
      
      // Проверяем уникальность нового имени пользователя (исключая целевого пользователя)
      const isNameUnique = await checkDisplayNameUnique(newDisplayName, targetUserId);
      if (!isNameUnique) {
        throw new Error('Пользователь с таким именем уже существует');
      }
      
      // Немедленно запускаем прямое обновление DOM для быстрой обратной связи
      // если это текущий пользователь
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === targetUserId) {
          try {
            const usernameElements = document.querySelectorAll('.username, [data-user-displayname]');
            usernameElements.forEach(element => {
              if (element.classList.contains('username') || element.hasAttribute('data-user-displayname')) {
                element.textContent = newDisplayName;
              }
            });
          } catch (error) {
            console.error('Ошибка при прямом обновлении DOM:', error);
          }
        }
      }
      
      // ПОДХОД С МНОЖЕСТВЕННЫМИ ОБНОВЛЕНИЯМИ:
      
      // 1. Обновляем display_name в таблице profiles
      console.log(`Обновление display_name в таблице profiles для пользователя ${targetUserId}`);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          display_name: newDisplayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);
        
      if (profileError) {
        console.error('Ошибка при обновлении display_name в profiles:', profileError);
        throw new Error(`Ошибка при обновлении имени пользователя: ${profileError.message}`);
      }
      
      // 2. Обновляем запись в auth.users ЧЕРЕЗ ADMIN API
      try {
        console.log(`Прямое обновление auth.users для пользователя ${targetUserId} через Admin API`);
        
        // Получаем текущие данные пользователя
        const { data: userData, error: getUserError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', targetUserId)
          .single();
          
        if (getUserError) {
          console.error('Ошибка при получении email пользователя:', getUserError);
          throw new Error('Не удалось получить данные пользователя');
        }
        
        if (!userData || !userData.email) {
          throw new Error('Email пользователя не найден');
        }
        
        // Используем Admin API для обновления пользователя
        // ВАЖНО: Этот метод также обновляет метаданные в auth.users, в отличие от SQL функций
        const { data: adminUpdateData, error: adminUpdateError } = await supabase.auth.admin.updateUserById(
          targetUserId,
          { 
            user_metadata: { display_name: newDisplayName } 
          }
        );
        
        if (adminUpdateError) {
          console.error('Ошибка при обновлении метаданных через Admin API:', adminUpdateError);
          
          // Если Admin API не работает, попробуем обычное обновление метаданных
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: { display_name: newDisplayName }
          });
          
          if (updateUserError) {
            console.error('Ошибка при обновлении метаданных через обычное API:', updateUserError);
          } else {
            console.log('Метаданные обновлены через обычное API');
          }
        } else {
          console.log('Метаданные успешно обновлены через Admin API');
        }
      } catch (adminError) {
        console.error('Ошибка при вызове Admin API:', adminError);
        // Продолжаем выполнение, так как profiles уже обновлены
      }
      
      // 3. Последняя попытка через SQL-функцию (для запаса)
      console.log(`Вызов функции sync_user_display_name как запасного варианта`);
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'sync_user_display_name',
        { 
          admin_id: adminId,
          target_user_id: targetUserId,
          new_display_name: newDisplayName
        }
      );
      
      if (updateError) {
        console.error('Ошибка SQL-функции sync_user_display_name:', updateError);
        // Продолжаем выполнение, так как прямое обновление уже выполнено
      } else {
        console.log('Результат SQL-функции sync_user_display_name:', updateResult);
      }
      
      // 4. Особо важные пользователи - попытка прямого запроса к базе для admin@gmail.com
      if (adminEmail === 'igoraor79@gmail.com') {
        try {
          console.log('Выполнение прямого SQL запроса администратором...');
          
          // Выполняем прямой SQL запрос для обновления метаданных
          const { error: directSqlError } = await supabase.rpc(
            'direct_update_user_metadata',
            {
              target_id: targetUserId,
              display_name_value: newDisplayName
            }
          );
          
          if (directSqlError) {
            console.error('Ошибка при выполнении прямого SQL запроса:', directSqlError);
          } else {
            console.log('Прямой SQL запрос выполнен успешно');
          }
        } catch (directSqlException) {
          console.error('Исключение при выполнении прямого SQL:', directSqlException);
        }
      }
      
      console.log('Имя пользователя успешно обновлено в profiles и метаданных');
      
      // Обновляем кеш профилей
      userProfileService.updateProfileCache(targetUserId, { displayName: newDisplayName });
      
      // Генерируем событие для немедленного уведомления всех компонентов
      emitEvent('profileUpdated', { 
        userId: targetUserId, 
        profileData: { displayName: newDisplayName } 
      });
      
      // Вызываем глобальное событие обновления пользователя
      // Получаем полные данные пользователя, если доступны
      let userForUpdate = { id: targetUserId, displayName: newDisplayName };
      
      try {
        // Проверяем, есть ли данные пользователя в localStorage (если это текущий пользователь)
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const currentUser = JSON.parse(userStr);
          if (currentUser.id === targetUserId) {
            currentUser.displayName = newDisplayName;
            localStorage.setItem('user', JSON.stringify(currentUser));
            userForUpdate = currentUser;
            
            // Генерируем локальное событие storage для имитации изменения localStorage
            if (typeof window !== 'undefined') {
              const storageEvent = new StorageEvent('storage', {
                key: 'user',
                newValue: JSON.stringify(currentUser),
                url: window.location.href
              });
              window.dispatchEvent(storageEvent);
              
              // Дополнительное пользовательское событие для гарантированного обновления
              const customEvent = new CustomEvent('userDisplayNameChanged', {
                detail: { newDisplayName, userId: targetUserId }
              });
              window.dispatchEvent(customEvent);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при обновлении localStorage:', error);
      }
      
      triggerUserUpdate(userForUpdate);
      
      // Вызываем коллбэк для обновления состояния
      if (onUpdateComplete && typeof onUpdateComplete === 'function') {
        await onUpdateComplete();
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении имени пользователя администратором:', error);
      throw error;
    }
  },

  // Исправление проблем с профилями пользователей через SQL-скрипт
  async fixProfileIssues() {
    try {
      // Проверяем, является ли пользователь администратором
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session || session.session.user.email !== 'igoraor79@gmail.com') {
        throw new Error('Только администратор может выполнять эту операцию');
      }
      
      // Получаем SQL-скрипт из файла
      const response = await fetch('/src/sql/profile_navigation_fix.sql');
      if (!response.ok) {
        throw new Error('Не удалось загрузить скрипт для исправления профилей');
      }
      
      const sqlScript = await response.text();
      
      // Выполняем SQL-скрипт через RPC (удаленный вызов процедур)
      const { data, error } = await supabase.rpc('execute_sql_admin', {
        sql_query: sqlScript
      });
      
      if (error) {
        console.error('Ошибка при выполнении SQL-скрипта:', error);
        throw new Error(`Ошибка при исправлении профилей: ${error.message}`);
      }
      
      console.log('Результат выполнения SQL-скрипта:', data);
      
      return {
        success: true,
        message: 'Проблемы с профилями успешно исправлены',
        details: data
      };
    } catch (error) {
      console.error('Ошибка при исправлении профилей:', error);
      throw error;
    }
  },

  // Добавление новой привилегии пользователю
  async addUserPerk(userId, perkName) {
    try {
      // Получаем текущую сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Пользователь не авторизован');
      }
      
      const currentUserId = sessionData.session.user.id;
      
      // Проверяем права администратора
      const isAdmin = sessionData.session.user.email === 'igoraor79@gmail.com' || 
                     sessionData.session.user.user_metadata?.perks?.includes('admin') || 
                     sessionData.session.user.user_metadata?.active_perk === 'admin';
                     
      if (!isAdmin) {
        throw new Error('Недостаточно прав для изменения привилегий пользователей');
      }
      
      // Получаем текущие перки пользователя
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('perks')
        .eq('id', userId)
        .single();
        
      if (userError) {
        throw new Error(`Не удалось получить информацию о пользователе: ${userError.message}`);
      }
      
      // Проверяем, есть ли уже данная привилегия у пользователя
      const currentPerks = Array.isArray(userData.perks) ? userData.perks : [];
      if (currentPerks.includes(perkName)) {
        return { success: true, message: 'Пользователь уже имеет данную привилегию' };
      }
      
      // Добавляем новую привилегию
      const updatedPerks = [...currentPerks, perkName];
      
      // Обновляем перки в профиле
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ perks: updatedPerks })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(updateError.message || 'Ошибка при добавлении привилегии');
      }
      
      // Записываем информацию о добавлении привилегии в таблицу user_perks
      const { error: logError } = await supabase
        .from('user_perks')
        .insert({
          user_id: userId,
          perk_name: perkName,
          granted_at: new Date().toISOString(),
          granted_by: currentUserId,
          is_active: true,
          metadata: {
            action: 'add_perk',
            previous_perks: currentPerks
          }
        });
      
      if (logError) {
        console.error('Ошибка при записи истории привилегий:', logError);
        // Не прерываем операцию, если ведение истории не удалось
      }
      
      return { success: true, perks: updatedPerks };
    } catch (error) {
      console.error('Ошибка при добавлении привилегии:', error);
      throw error;
    }
  },
  
  // Получение истории перков пользователя
  async getUserPerksHistory(userId) {
    try {
      // Получаем текущую сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Пользователь не авторизован');
      }
      
      const currentUserId = sessionData.session.user.id;
      
      // Только владелец аккаунта или администратор может просматривать историю
      const isAdmin = sessionData.session.user.email === 'igoraor79@gmail.com' || 
                     sessionData.session.user.user_metadata?.perks?.includes('admin') || 
                     sessionData.session.user.user_metadata?.active_perk === 'admin';
                     
      if (currentUserId !== userId && !isAdmin) {
        throw new Error('Недостаточно прав для просмотра истории привилегий');
      }
      
      // Получаем историю перков пользователя
      const { data, error } = await supabase
        .from('user_perks')
        .select('*')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false });
        
      if (error) {
        throw new Error(`Не удалось получить историю привилегий: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Ошибка при получении истории привилегий:', error);
      throw error;
    }
  }
};

export default authAdmin; 