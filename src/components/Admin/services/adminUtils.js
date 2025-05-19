import supabase from '../../../services/supabaseClient';

// Check and update ban status for users
export const checkAndUpdateBanStatus = async (usersData) => {
  const now = new Date();
  const updatePromises = [];
  
  for (const user of usersData) {
    if (user.is_banned && user.ban_end_at) {
      const banEndDate = new Date(user.ban_end_at);
      
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
        
        updatePromises.push(
          supabase
            .from('user_bans')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('is_active', true)
        );
        
        user.is_banned = false;
        user.ban_reason = null;
        user.ban_end_at = null;
        user.ban_admin_id = null;
        user.ban_admin_name = null;
      }
    }
  }
  
  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
    console.log(`Разблокировано пользователей: ${updatePromises.length / 2}`);
  }
  
  return usersData;
};

// Load profiles directly from Supabase
export const loadProfilesDirectly = async () => {
  try {
    console.log('Прямая загрузка профилей из Supabase...');
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error('Ошибка при получении профилей:', profilesError);
      throw new Error('Ошибка загрузки профилей пользователей');
    }
    
    if (!profilesData || profilesData.length === 0) {
      console.log('Профили не найдены');
      return [];
    }
    
    console.log('Загружено профилей:', profilesData.length);
    
    let authUsers = [];
    
    try {
      const { data, error } = await supabase.rpc('admin_get_users');
      
      if (!error && data) {
        authUsers = data;
        console.log('Загружено данных из auth.users:', authUsers.length);
      }
    } catch (authError) {
      console.warn('Не удалось получить данные пользователей из auth схемы:', authError);
    }
    
    let combinedUsers = profilesData.map(profile => {
      const authUser = authUsers.find(au => au.id === profile.id);
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
    
    combinedUsers = await checkAndUpdateBanStatus(combinedUsers);
    
    console.log('Подготовлен список пользователей:', combinedUsers.length);
    return combinedUsers;
    
  } catch (err) {
    console.error('Ошибка при загрузке пользователей:', err);
    throw err;
  }
};

// Update user privileges
export const updateUserPrivileges = async (userId, newPrivileges) => {
  try {
    console.log(`Начинаем обновление привилегий для пользователя ${userId}`);
    
    const { data: currentProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (getError) {
      console.error('Ошибка при получении профиля:', getError);
      throw new Error(`Не удалось получить профиль: ${getError.message}`);
    }
    
    let updatedPerks = ['user'];
    
    if (newPrivileges.includes('early_user')) {
      updatedPerks.push('early_user');
    }
    
    if (newPrivileges.includes('sponsor')) {
      updatedPerks.push('sponsor');
    }
    
    if (newPrivileges.includes('admin')) {
      updatedPerks.push('admin');
    }
    
    let activePerk = currentProfile.active_perk;
    
    if (!updatedPerks.includes(activePerk)) {
      activePerk = updatedPerks[0];
    }
    
    // Try standard UPDATE
    const updateResult = await supabase
      .from('profiles')
      .update({
        perks: updatedPerks,
        active_perk: activePerk,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateResult.error) {
      console.warn('Стандартное обновление не сработало:', updateResult.error);
      
      // Try RPC function
      try {
        const { error: rpcError } = await supabase.rpc('admin_update_privileges', {
          user_id: userId,
          privileges: updatedPerks
        });
        
        if (rpcError) {
          console.error('Ошибка RPC функции:', rpcError);
          throw new Error(`Ошибка при обновлении привилегий через RPC: ${rpcError.message}`);
        }
        
        // Update active privilege separately
        const { error: activeError } = await supabase
          .from('profiles')
          .update({ active_perk: activePerk })
          .eq('id', userId);
          
        if (activeError) {
          console.warn('Не удалось обновить активную привилегию:', activeError);
        }
      } catch (rpcErr) {
        console.error('Ошибка при вызове RPC:', rpcErr);
        
        // Try alternative approach
        const perksJsonString = JSON.stringify(updatedPerks);
        
        const { error: finalError } = await supabase
          .from('profiles')
          .update({
            raw_perks: perksJsonString,
            special_update: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (finalError) {
          console.error('Финальная попытка не удалась:', finalError);
          throw finalError;
        }
      }
    }
    
    // Verify update
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (updatedProfile) {
      console.log('Привилегии обновились корректно');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка в функции updateUserPrivileges:', error);
    throw error;
  }
}; 