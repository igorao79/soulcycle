import supabase from './supabaseClient';
import userProfileService from './userProfileService';
import filterBadWords from '../utils/filterBadWords';

// Хелпер: получить профили пакетно по массиву user_id
async function fetchProfilesBatch(userIds) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar, perks, active_perk')
    .in('id', unique);

  const map = new Map();
  if (error) {
    console.error('Ошибка batch-загрузки профилей:', error);
    return map;
  }
  for (const p of data) {
    map.set(p.id, {
      displayName: p.display_name || 'Пользователь',
      avatar: p.avatar || null,
      perks: p.perks || [],
      activePerk: p.active_perk || (p.perks && p.perks[0]) || 'user',
      id: p.id
    });
  }
  return map;
}

const DEFAULT_AUTHOR = {
  displayName: 'Пользователь',
  avatar: null,
  perks: [],
  activePerk: 'user'
};

const commentService = {
  // Получение комментариев к посту
  async getCommentsByPostId(postId) {
    try {
      // 1. Получаем ВСЕ комментарии к посту одним запросом (корневые + ответы)
      const { data: allComments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      if (!allComments || allComments.length === 0) {
        return [];
      }

      // 2. Собираем все уникальные user_id и загружаем профили одним запросом
      const userIds = allComments.map(c => c.user_id);
      const profilesMap = await fetchProfilesBatch(userIds);

      const getAuthor = (userId) => {
        const profile = profilesMap.get(userId);
        return profile ? { ...profile } : { ...DEFAULT_AUTHOR, id: userId };
      };

      // 3. Разделяем на корневые и ответы
      const rootComments = [];
      const repliesByParentId = new Map();

      for (const comment of allComments) {
        if (comment.parent_id === null) {
          rootComments.push(comment);
        } else {
          if (!repliesByParentId.has(comment.parent_id)) {
            repliesByParentId.set(comment.parent_id, []);
          }
          repliesByParentId.get(comment.parent_id).push(comment);
        }
      }

      // 4. Собираем результат — без дополнительных запросов
      const enrichedComments = rootComments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(comment => {
          const replies = (repliesByParentId.get(comment.id) || []).map(reply => ({
            ...reply,
            author: getAuthor(reply.user_id)
          }));

          return {
            ...comment,
            author: getAuthor(comment.user_id),
            replies
          };
        });

      return enrichedComments;
    } catch (error) {
      console.error('Ошибка при получении комментариев:', error);
      return [];
    }
  },
  
  // Создание нового комментария
  async createComment(commentData) {
    try {
      const authorProfile = await userProfileService.getUserProfile(commentData.userId);

      const filteredContent = filterBadWords(commentData.content, {
        id: commentData.userId,
        ...authorProfile
      });

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          content: filteredContent,
          post_id: commentData.postId,
          user_id: commentData.userId,
          parent_id: null
        })
        .select();

      if (error) {
        console.error('Детали ошибки вставки:', error);
        throw error;
      }

      return {
        ...data[0],
        author: {
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          perks: authorProfile.perks || [],
          activePerk: authorProfile.activePerk || 'user',
          id: commentData.userId
        },
        replies: []
      };
    } catch (error) {
      console.error('Ошибка при создании комментария:', error);
      throw error;
    }
  },
  
  // Создание ответа на комментарий
  async replyToComment(replyData) {
    try {
      const authorProfile = await userProfileService.getUserProfile(replyData.userId);

      const filteredContent = filterBadWords(replyData.content, {
        id: replyData.userId,
        ...authorProfile
      });

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          content: filteredContent,
          post_id: replyData.postId,
          user_id: replyData.userId,
          parent_id: replyData.commentId
        })
        .select();

      if (error) {
        console.error('Детали ошибки вставки:', error);
        throw error;
      }

      return {
        ...data[0],
        author: {
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          perks: authorProfile.perks || [],
          activePerk: authorProfile.activePerk || 'user',
          id: replyData.userId
        }
      };
    } catch (error) {
      console.error('Ошибка при создании ответа на комментарий:', error);
      throw error;
    }
  },
  
  // Получение количества комментариев для поста
  async getCommentsCount(postId) {
    try {
      // Получаем общее количество комментариев к посту, включая ответы
      const { count, error } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Ошибка при получении количества комментариев:', error);
      throw error;
    }
  },
  
  // Удаление комментария (для админов и авторов комментария)
  async deleteComment(commentId, userId) {
    try {
      // Проверяем, имеет ли пользователь право удалить комментарий
      if (userId) {
        try {
          // Получаем информацию о комментарии, чтобы проверить владельца
          const { data: commentData, error: fetchError } = await supabase
            .from('post_comments')
            .select('user_id, post_id')
            .eq('id', commentId)
            .maybeSingle(); // Используем maybeSingle вместо single
          
          if (fetchError) {
            console.error('Ошибка при получении данных комментария:', fetchError);
            // Если комментарий не найден, мы всё равно разрешаем операцию удаления
            // Возможно, он уже был удален
          } else if (commentData) {
            // Комментарий найден, проверяем права
            const isCommentOwner = commentData.user_id === userId;
            
            // Проверяем, является ли пользователь админом
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('perks, active_perk, email')
              .eq('id', userId)
              .maybeSingle(); // Используем maybeSingle
            
            const isAdmin = !userError && userData && (
              userData.email === 'igoraor79@gmail.com' || 
              (userData.perks && userData.perks.includes('admin')) || 
              userData.active_perk === 'admin'
            );
            
            // Если пользователь не автор комментария и не админ, запрещаем удаление
            if (!isCommentOwner && !isAdmin) {
              throw new Error('У вас нет прав для удаления этого комментария');
            }
          }
          // Если комментарий не найден, просто продолжаем процесс удаления
        } catch (error) {
          // Если ошибка не связана с отсутствием комментария, а с чем-то другим
          if (error.message !== 'У вас нет прав для удаления этого комментария') {
            console.error('Ошибка при проверке прав на удаление:', error);
            // Продолжаем процесс удаления, так как ошибка может быть вызвана
            // отсутствием комментария, который мы и хотим удалить
          } else {
            // Если ошибка связана с отсутствием прав, пробрасываем её дальше
            throw error;
          }
        }
      }
      
      // Сначала удаляем все ответы на комментарий (если есть)
      try {
        const { error: repliesError } = await supabase
          .from('post_comments')
          .delete()
          .eq('parent_id', commentId);
          
        if (repliesError) {
          console.error('Ошибка при удалении ответов на комментарий:', repliesError);
          // Продолжаем, даже если не удалось удалить ответы
        }
      } catch (repliesError) {
        console.error('Ошибка при удалении ответов на комментарий:', repliesError);
        // Продолжаем, даже если не удалось удалить ответы
      }
      
      // Затем удаляем сам комментарий
      try {
        const { data, error } = await supabase
          .from('post_comments')
          .delete()
          .eq('id', commentId)
          .select();
        
        if (error) {
          console.error('Ошибка при удалении комментария:', error);
          throw error;
        }
        
        return { 
          success: true, 
          message: 'Комментарий успешно удален',
          deletedComment: data && data.length > 0 ? data[0] : null
        };
      } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      throw error;
    }
  }
};

export default commentService; 