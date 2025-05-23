import supabase from '../supabaseClient';

/**
 * Service for pin operations on posts
 */
const postPinService = {
  /**
   * Pin a post (admin only)
   * @param {string} postId - Post ID
   */
  async pinPost(postId) {
    try {
      console.log('Пытаемся закрепить пост с ID:', postId);
      
      // Проверяем права администратора
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Получаем профиль пользователя для проверки прав администратора
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('perks, active_perk, email')
        .eq('id', currentUser.id)
        .single();
      
      if (profileError) {
        console.error('Ошибка при получении профиля пользователя:', profileError);
        throw new Error('Не удалось проверить права пользователя');
      }
      
      const perks = profileData?.perks || [];
      const activePerk = profileData?.active_perk || '';
      const email = profileData?.email || '';
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = 
        email === 'igoraor79@gmail.com' || 
        perks.includes('admin') || 
        activePerk === 'admin';
      
      if (!isAdmin) {
        throw new Error('Только администраторы могут закреплять посты');
      }

      // Находим текущий закрепленный пост (если есть)
      const { data: currentlyPinned, error: findPinnedError } = await supabase
        .from('posts')
        .select('id')
        .eq('is_pinned', true)
        .limit(1);

      const previouslyPinnedId = currentlyPinned && currentlyPinned.length > 0 ? currentlyPinned[0].id : null;
      
      // Проверим корректность ID поста для диагностики
      if (!postId || typeof postId !== 'string' || !postId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error(`Некорректный ID поста: ${postId}`);
      }
      
      // Метод 1: Используем RPC для закрепления поста
      console.log('Вызываем функцию pin_post для поста ID:', postId);
      const { data: rpcData, error: rpcError } = await supabase.rpc('pin_post', { 
        post_id_to_pin: postId 
      });
      
      if (rpcError) {
        console.error('RPC Ошибка при закреплении поста (детально):', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        });
        
        // Метод 2: Если RPC не сработал, делаем обновление вручную через транзакцию
        console.log('Пробуем альтернативный метод закрепления...');
        
        // Сначала снимаем закрепление со всех постов
        const { error: unpinError } = await supabase
          .from('posts')
          .update({ is_pinned: false })
          .eq('is_pinned', true);
        
        if (unpinError) {
          console.error('Ошибка при снятии закрепления:', unpinError);
          throw unpinError;
        }
        
        // Затем закрепляем нужный пост
        const { data: pinData, error: pinError } = await supabase
          .from('posts')
          .update({ is_pinned: true })
          .eq('id', postId)
          .select('*');
        
        if (pinError) {
          console.error('Ошибка при закреплении поста (альтернативный метод):', pinError);
          throw pinError;
        }
        
        return { 
          success: true, 
          post: pinData?.[0] || null,
          previouslyPinnedId
        };
      }
      
      console.log('Успешно закрепили пост с ID:', postId);
      console.log('Полученные данные:', rpcData);
      
      return { 
        success: true, 
        post: rpcData,
        previouslyPinnedId 
      };
    } catch (error) {
      console.error('Ошибка при закреплении поста:', error);
      throw error;
    }
  },
  
  /**
   * Unpin a post (admin only)
   * @param {string} postId - Post ID
   */
  async unpinPost(postId) {
    try {
      // Проверяем права администратора
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Получаем профиль пользователя для проверки прав администратора
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('perks, active_perk, email')
        .eq('id', currentUser.id)
        .single();
      
      if (profileError) {
        console.error('Ошибка при получении профиля пользователя:', profileError);
        throw new Error('Не удалось проверить права пользователя');
      }
      
      const perks = profileData?.perks || [];
      const activePerk = profileData?.active_perk || '';
      const email = profileData?.email || '';
      
      // Проверяем, является ли пользователь администратором
      const isAdmin = 
        email === 'igoraor79@gmail.com' || 
        perks.includes('admin') || 
        activePerk === 'admin';
      
      if (!isAdmin) {
        throw new Error('Только администраторы могут открепить посты');
      }
      
      // Обновляем пост, снимая флаг закрепления
      const { data, error } = await supabase
        .from('posts')
        .update({ is_pinned: false })
        .eq('id', postId)
        .select();
      
      if (error) {
        console.error('Ошибка при откреплении поста:', error);
        throw error;
      }
      
      return { success: true, post: data?.[0] };
    } catch (error) {
      console.error('Ошибка при откреплении поста:', error);
      throw error;
    }
  }
};

export default postPinService; 