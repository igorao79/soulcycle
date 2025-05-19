import supabase from './supabaseClient';
import userProfileService from './userProfileService';
import filterBadWords from '../utils/filterBadWords';

const commentService = {
  // Получение комментариев к посту
  async getCommentsByPostId(postId) {
    try {
      console.log('Fetching comments for post ID:', postId);
      
      // Получаем все комментарии к посту
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null) // Только корневые комментарии
        .order('created_at', { ascending: false }); // Новые комментарии сверху
      
      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
      
      console.log('Raw comments fetched:', comments ? comments.length : 0);
      
      // Если комментариев нет, возвращаем пустой массив
      if (!comments || comments.length === 0) {
        return [];
      }
      
      // Подготавливаем массив для обогащенных данных
      const enrichedComments = [];
      
      // Для каждого комментария получаем дополнительную информацию
      for (const comment of comments) {
        try {
          // Получаем профиль автора комментария через userProfileService
          const authorProfile = await userProfileService.getUserProfile(comment.user_id);
          
          // Получаем перки пользователя
          const { data: profileData } = await supabase
            .from('profiles')
            .select('perks, active_perk')
            .eq('id', comment.user_id)
            .single();
          
          const perks = profileData?.perks || [];
          const activePerk = profileData?.active_perk || perks[0] || 'user';
          
          // Получаем ответы на этот комментарий
          const { data: replies, error: repliesError } = await supabase
            .from('post_comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true }); // Старые ответы сверху, новые снизу
          
          if (repliesError) {
            console.error('Error fetching replies:', repliesError);
            throw repliesError;
          }
          
          console.log(`Comment ${comment.id} has ${replies ? replies.length : 0} replies`);
          
          // Обогащаем ответы данными профилей
          const enrichedReplies = [];
          for (const reply of replies || []) {
            try {
              const replyAuthorProfile = await userProfileService.getUserProfile(reply.user_id);
              
              // Получаем перки автора ответа
              const { data: replyProfileData } = await supabase
                .from('profiles')
                .select('perks, active_perk')
                .eq('id', reply.user_id)
                .single();
              
              const replyPerks = replyProfileData?.perks || [];
              const replyActivePerk = replyProfileData?.active_perk || replyPerks[0] || 'user';
              
              enrichedReplies.push({
                ...reply,
                author: {
                  displayName: replyAuthorProfile.displayName,
                  avatar: replyAuthorProfile.avatar,
                  perks: replyPerks,
                  activePerk: replyActivePerk,
                  id: reply.user_id
                }
              });
            } catch (error) {
              console.error('Ошибка при обогащении ответа данными:', error);
              enrichedReplies.push({
                ...reply,
                author: {
                  displayName: 'Пользователь',
                  avatar: null,
                  perks: [],
                  activePerk: 'user',
                  id: reply.user_id
                }
              });
            }
          }
          
          // Добавляем комментарий с дополнительной информацией
          enrichedComments.push({
            ...comment,
            author: {
              displayName: authorProfile.displayName,
              avatar: authorProfile.avatar,
              perks: perks,
              activePerk: activePerk,
              id: comment.user_id
            },
            replies: enrichedReplies
          });
        } catch (error) {
          console.error('Ошибка при обогащении комментария данными:', error);
          // Добавляем комментарий с минимальными данными в случае ошибки
          enrichedComments.push({
            ...comment,
            author: {
              displayName: 'Пользователь',
              avatar: null,
              perks: [],
              activePerk: 'user',
              id: comment.user_id
            },
            replies: []
          });
        }
      }
      
      console.log('Enriched comments processed:', enrichedComments.length);
      return enrichedComments;
    } catch (error) {
      console.error('Ошибка при получении комментариев:', error);
      // Возвращаем пустой массив вместо ошибки, чтобы не блокировать интерфейс
      return [];
    }
  },
  
  // Создание нового комментария
  async createComment(commentData) {
    try {
      // Получаем профиль пользователя через userProfileService
      const authorProfile = await userProfileService.getUserProfile(commentData.userId);
      
      // Применяем фильтр плохих слов к контенту
      const filteredContent = filterBadWords(commentData.content, {
        id: commentData.userId,
        ...authorProfile
      });
      
      // Создаем комментарий
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          content: filteredContent, // Используем отфильтрованный контент
          post_id: commentData.postId,
          user_id: commentData.userId,
          parent_id: null // Это корневой комментарий, не ответ
        })
        .select();
      
      if (error) {
        console.error('Детали ошибки вставки:', error);
        throw error;
      }
      
      // Получаем перки пользователя
      const { data: profileData } = await supabase
        .from('profiles')
        .select('perks, active_perk')
        .eq('id', commentData.userId)
        .single();
      
      const perks = profileData?.perks || [];
      const activePerk = profileData?.active_perk || perks[0] || 'user';
      
      return {
        ...data[0],
        author: {
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          perks: perks,
          activePerk: activePerk,
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
      // Получаем профиль пользователя через userProfileService
      const authorProfile = await userProfileService.getUserProfile(replyData.userId);
      
      // Применяем фильтр плохих слов к контенту
      const filteredContent = filterBadWords(replyData.content, {
        id: replyData.userId,
        ...authorProfile
      });
      
      // Создаем ответ на комментарий
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          content: filteredContent, // Используем отфильтрованный контент
          post_id: replyData.postId,
          user_id: replyData.userId,
          parent_id: replyData.commentId // Это ответ на комментарий
        })
        .select();
      
      if (error) {
        console.error('Детали ошибки вставки:', error);
        throw error;
      }
      
      // Получаем перки пользователя
      const { data: profileData } = await supabase
        .from('profiles')
        .select('perks, active_perk')
        .eq('id', replyData.userId)
        .single();
      
      const perks = profileData?.perks || [];
      const activePerk = profileData?.active_perk || perks[0] || 'user';
      
      return {
        ...data[0],
        author: {
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          perks: perks,
          activePerk: activePerk,
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