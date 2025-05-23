import supabase from '../supabaseClient';

/**
 * Service for post likes operations
 */
const postLikeService = {
  /**
   * Toggle like on a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   */
  async toggleLike(postId, userId) {
    try {
      // Проверяем, существует ли уже лайк
      const { data: existingLike, error: checkError } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (checkError) throw checkError;
      
      // Если лайк уже есть - удаляем его
      if (existingLike && existingLike.length > 0) {
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
          
        if (deleteError) throw deleteError;
        
        // Получаем актуальное количество лайков
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
          
        return { liked: false, likesCount: likesCount || 0 };
      } 
      // Если лайка нет - добавляем
      else {
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
          
        if (insertError) throw insertError;
        
        // Получаем актуальное количество лайков
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
          
        return { liked: true, likesCount: likesCount || 0 };
      }
    } catch (error) {
      console.error('Ошибка при обновлении лайка:', error);
      throw error;
    }
  },
  
  /**
   * Check if post is liked by user
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   */
  async isLikedByUser(postId, userId) {
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return { liked: data && data.length > 0 };
    } catch (error) {
      console.error('Ошибка при проверке лайка:', error);
      throw error;
    }
  },
  
  /**
   * Get likes count for a post
   * @param {string} postId - Post ID
   */
  async getLikesCount(postId) {
    try {
      const { count, error } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Ошибка при получении количества лайков:', error);
      throw error;
    }
  }
};

export default postLikeService; 