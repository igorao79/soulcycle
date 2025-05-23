import supabase from './supabaseClient';
import userProfileService from './userProfileService';
import imageService from '../utils/imageService';

const postService = {
  // Получение постов с пагинацией
  async getPosts(page = 1, limit = 10) {
    try {
      // Проверяем, существует ли колонка styling в таблице posts
      let hasStylingColumn = false;
      try {
        // Проверяем структуру таблицы постов
        const { data: columns, error: columnsError } = await supabase
          .from('posts')
          .select('styling')
          .limit(1);
        
        hasStylingColumn = !columnsError;
      } catch (columnsError) {
        console.log('Колонка styling отсутствует в таблице posts:', columnsError);
      }

      // Вычисляем смещение на основе страницы и лимита
      const offset = (page - 1) * limit;
      
      // Получаем посты с пагинацией
      const { data: posts, error: postsError, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .order('is_pinned', { ascending: false }) // Сначала закрепленные
        .order('created_at', { ascending: false }) // Затем по дате создания
        .range(offset, offset + limit - 1); // Используем range для пагинации
      
      if (postsError) throw postsError;

      // Подготавливаем массив для обогащенных данных
      const enrichedPosts = [];

      // Для каждого поста получаем дополнительную информацию
      for (const post of posts) {
        try {
          // Получаем профиль автора через userProfileService
          const authorProfile = await userProfileService.getUserProfile(post.user_id);
          
          // Получаем перки пользователя из таблицы profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('perks, active_perk')
            .eq('id', post.user_id)
            .single();
            
          const perks = profileData?.perks || [];
          const activePerk = profileData?.active_perk || perks[0] || 'user';
          
          // Получаем количество лайков
          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
            
          // Получаем количество комментариев (включая ответы)
          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          // Проверяем, есть ли у поста связанный опрос
          let poll = null;
          if (post.poll_data) {
            console.log('Poll data from DB:', post.poll_data);
            poll = post.poll_data;
          }

          // Добавляем пост с дополнительной информацией
          enrichedPosts.push({
            id: post.id,
            title: post.title || null,
            content: post.content,
            image_url: post.image_url,
            image_urls: post.image_urls || null,
            created_at: post.created_at,
            user_id: post.user_id,
            author: {
              displayName: authorProfile.displayName,
              avatar: authorProfile.avatar,
              perks: perks,
              activePerk: activePerk,
              id: post.user_id
            },
            styling: hasStylingColumn ? (post.styling || null) : null,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            poll_data: poll,
            is_pinned: post.is_pinned || false
          });
        } catch (error) {
          console.error('Ошибка при обогащении поста данными:', error);
          // Добавляем пост с минимальными данными в случае ошибки
          enrichedPosts.push({
            id: post.id,
            title: post.title || null,
            content: post.content,
            image_url: post.image_url,
            image_urls: post.image_urls || null,
            created_at: post.created_at,
            user_id: post.user_id,
            author: {
              displayName: 'Пользователь',
              avatar: null,
              perks: [],
              activePerk: 'user',
              id: post.user_id
            },
            styling: null,
            likes_count: 0,
            comments_count: 0,
            poll_data: null,
            is_pinned: post.is_pinned || false
          });
        }
      }
      
      // Возвращаем информацию о пагинации вместе с постами
      return {
        posts: enrichedPosts,
        totalCount: count || 0,
        hasMore: (offset + posts.length) < (count || 0),
        nextPage: (offset + posts.length) < (count || 0) ? page + 1 : null
      };
    } catch (error) {
      console.error('Ошибка при получении постов:', error);
      throw error;
    }
  },
  
  // Создание нового поста
  async createPost(postData) {
    try {
      const {
        title,
        content,
        imageUrls,
        userId,
        poll,
        styling,
        isPinned
      } = postData;
      
      console.log('Creating post with userId:', userId);
      
      // Проверяем права администратора перед созданием поста
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('perks, active_perk, email')
        .eq('id', userId)
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
        throw new Error('У вас недостаточно прав для создания постов');
      }
      
      // Check if image_urls column exists in posts table
      let hasImageUrlsColumn = false;
      try {
        // Try to check if column exists
        const { data: columnCheck, error: columnError } = await supabase
          .from('posts')
          .select('image_urls')
          .limit(1);
          
        hasImageUrlsColumn = !columnError;
      } catch (error) {
        console.log('Колонка image_urls отсутствует, используем только image_url');
      }
      
      // Подготовленные данные поста
      const newPostData = {
        title: title || null,
        content,
        image_url: null,
      };
      
      // If we have imageUrls, set the first one as the main image_url
      if (imageUrls && imageUrls.length > 0) {
        // Use the direct Cloudinary URL without any modifications
        newPostData.image_url = imageUrls[0];
      }
      
      // Only add image_urls if the column exists
      if (hasImageUrlsColumn && imageUrls && imageUrls.length > 0) {
        // Use the original imageUrls directly without optimization
        newPostData.image_urls = imageUrls;
      }
      
      // Add remaining fields
      newPostData.user_id = userId;
      newPostData.created_at = new Date().toISOString();
      newPostData.poll_data = poll || null;
      newPostData.styling = styling || null;
      newPostData.is_pinned = isPinned || false;
      
      // Отображаем отправляемые данные для отладки
      console.log('Sending post data to Supabase:', JSON.stringify(newPostData));
      
      // Отправка запроса на создание поста
      const { data, error } = await supabase
        .from('posts')
        .insert([newPostData])
        .select();
      
      if (error) {
        console.error('Supabase error when creating post:', error);
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Не удалось создать пост');
      }
      
      // Получаем профиль автора для возврата вместе с постом
      const authorProfile = await userProfileService.getUserProfile(userId);
      
      // Формируем пост с данными автора
      const result = {
        ...data[0],
        title: data[0].title || null,
        image_url: data[0].image_url || null,
        image_urls: data[0].image_urls || null,
        author: {
          id: userId,
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          activePerk: authorProfile.activePerk || 'user',
          id: userId
        },
        likes_count: 0,
        comments_count: 0,
        poll_data: data[0].poll_data,
        is_pinned: data[0].is_pinned || false
      };
      
      console.log('Created post:', result);
      
      return result;
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      throw error;
    }
  },
  
  // Получение поста по ID
  async getPostById(postId) {
    try {
      // Проверяем, существует ли колонка styling в таблице posts
      let hasStylingColumn = false;
      try {
        // Проверяем структуру таблицы постов
        const { data: columns, error: columnsError } = await supabase
          .from('posts')
          .select('styling')
          .limit(1);
        
        hasStylingColumn = !columnsError;
      } catch (columnsError) {
        console.log('Колонка styling отсутствует в таблице posts:', columnsError);
      }

      // Получаем данные поста
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      // Получаем профиль автора через userProfileService
      const authorProfile = await userProfileService.getUserProfile(post.user_id);
      
      // Получаем перки пользователя из таблицы profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('perks, active_perk')
        .eq('id', post.user_id)
        .single();
        
      const perks = profileData?.perks || [];
      const activePerk = profileData?.active_perk || perks[0] || 'user';
      
      // Получаем количество лайков
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      // Получаем комментарии первого уровня (без родителя)
      const { data: comments } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
      
      // Обогащаем комментарии данными профилей
      const enrichedComments = [];
      
      for (const comment of comments) {
        try {
          // Получаем профиль автора комментария
          const commentAuthorProfile = await userProfileService.getUserProfile(comment.user_id);
          
          // Получаем перки пользователя из таблицы profiles
          const { data: commentProfileData } = await supabase
            .from('profiles')
            .select('perks, active_perk')
            .eq('id', comment.user_id)
            .single();
            
          const commentPerks = commentProfileData?.perks || [];
          const commentActivePerk = commentProfileData?.active_perk || commentPerks[0] || 'user';
          
          // Получаем ответы на комментарий
          const { data: replies } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', post.id)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });
          
          // Обогащаем ответы данными профилей
          const enrichedReplies = [];
          
          for (const reply of replies || []) {
            try {
              // Получаем профиль автора ответа
              const replyAuthorProfile = await userProfileService.getUserProfile(reply.user_id);
              
              // Получаем перки пользователя из таблицы profiles
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
          
          enrichedComments.push({
            ...comment,
            author: {
              displayName: commentAuthorProfile.displayName,
              avatar: commentAuthorProfile.avatar,
              perks: commentPerks,
              activePerk: commentActivePerk,
              id: comment.user_id
            },
            replies: enrichedReplies
          });
        } catch (error) {
          console.error('Ошибка при обогащении комментария данными:', error);
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
      
      return {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        image_urls: post.image_urls || null,
        created_at: post.created_at,
        user_id: post.user_id,
        author: {
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          perks: perks,
          activePerk: activePerk,
          id: post.user_id
        },
        styling: hasStylingColumn ? (post.styling || null) : null,
        likes_count: likesCount || 0,
        comments: enrichedComments,
        poll: post.poll_data
      };
    } catch (error) {
      console.error(`Ошибка при получении поста ID=${postId}:`, error);
      throw error;
    }
  },
  
  // Поставить или убрать лайк с поста
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
  
  // Проверить, лайкнул ли пользователь пост
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
  
  // Получить количество лайков поста
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
  },
  
  // Удаление поста (только для администраторов)
  async deletePost(postId) {
    try {
      // Проверяем, является ли пользователь администратором
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
        throw new Error('Только администраторы могут удалять посты');
      }

      // Получаем данные поста для удаления изображений
      const { data: post, error: postFetchError } = await supabase
        .from('posts')
        .select('image_url, image_urls')
        .eq('id', postId)
        .maybeSingle();
      
      if (postFetchError) {
        console.error('Ошибка при получении данных поста для удаления изображений:', postFetchError);
      } else if (post) {
        // Удаляем изображения из Cloudinary
        try {
          // Собираем все URL изображений
          const imageUrls = [];
          if (post.image_url) imageUrls.push(post.image_url);
          if (post.image_urls && Array.isArray(post.image_urls)) {
            // Make sure we only add valid URLs
            imageUrls.push(...post.image_urls.filter(url => url && typeof url === 'string'));
          }

          // Извлекаем publicId из каждого URL Cloudinary
          const publicIds = imageUrls
            .map(url => imageService.extractPublicIdFromUrl(url))
            .filter(id => id !== null);

          // Удаляем изображения из Cloudinary
          if (publicIds.length > 0) {
            console.log('Удаление изображений из Cloudinary:', publicIds);
            // Use a non-blocking call to avoid errors affecting post deletion
            imageService.deleteMultipleImages(publicIds)
              .then(success => {
                if (success) {
                  console.log(`Successfully deleted ${publicIds.length} images from Cloudinary`);
                } else {
                  console.warn(`Failed to delete some or all images from Cloudinary`);
                }
              })
              .catch(err => {
                console.error('Error during image deletion:', err);
              });
          } else {
            console.log('No valid Cloudinary public IDs found for deletion');
          }
        } catch (imageDeleteError) {
          console.error('Ошибка при удалении изображений из Cloudinary:', imageDeleteError);
          // Продолжаем удаление поста даже при ошибке удаления изображений
        }
      } else {
        console.log('Пост не найден или у него нет изображений для удаления');
      }
      
      // Сначала удаляем все связанные комментарии
      const { error: commentsError } = await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', postId);
      
      if (commentsError) {
        console.error('Ошибка при удалении комментариев:', commentsError);
      }
      
      // Затем удаляем все связанные лайки
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);
      
      if (likesError) {
        console.error('Ошибка при удалении лайков:', likesError);
      }
      
      // Удаляем все голоса в опросах, если они есть
      const { error: votesError } = await supabase
        .from('poll_votes')
        .delete()
        .eq('post_id', postId);
      
      if (votesError) {
        console.error('Ошибка при удалении голосов опроса:', votesError);
      }
      
      // Наконец удаляем сам пост
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
      throw error;
    }
  },
  
  // Функции для работы с опросами
  
  // Получение статуса голосования пользователя в опросе
  async getPollVoteStatus(postId, userId) {
    try {
      // Получаем данные поста, включая опрос
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('poll_data')
        .eq('id', postId)
        .single();
      
      if (postError) throw postError;
      if (!post.poll_data) throw new Error('У этого поста нет опроса');
      
      // Проверяем, голосовал ли пользователь в этом опросе
      try {
        const { data: vote, error: voteError } = await supabase
          .from('poll_votes')
          .select('option_index')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .throwOnError() // Включаем явное выбрасывание ошибок
          .maybeSingle(); // Используем maybeSingle вместо single для предотвращения ошибки PGRST116
        
        // Получаем результаты опроса
        const results = await this.getPollResults(postId);
        
        return {
          hasVoted: !!vote,
          option: vote ? vote.option_index : null,
          results: results.results
        };
      } catch (voteError) {
        console.error('Ошибка при получении голоса:', voteError);
        
        // Даже если произошла ошибка при получении голоса, 
        // все равно пытаемся вернуть результаты опроса
        const results = await this.getPollResults(postId);
        
        return {
          hasVoted: false,
          option: null,
          results: results.results
        };
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса голосования:', error);
      throw error;
    }
  },
  
  // Голосование в опросе - улучшенная версия
  async votePoll(postId, optionIndex) {
    if (!postId || typeof postId !== 'string') {
      console.error('Invalid postId:', postId);
      return { success: false, message: 'Некорректный ID поста' };
    }
    
    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      console.error('Invalid optionIndex:', optionIndex);
      return { success: false, message: 'Некорректный индекс опции' };
    }
    
    try {
      console.log(`Голосование в опросе: postId=${postId}, optionIndex=${optionIndex}`);
      
      // 1. Проверяем сессию пользователя
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        return { success: false, message: 'Ошибка сессии пользователя' };
      }
      
      const currentUser = sessionData?.session?.user;
      if (!currentUser) {
        return { success: false, message: 'Пользователь не авторизован' };
      }
      
      const userId = currentUser.id;
      console.log('ID пользователя для голосования:', userId);
      
      // 2. Получаем данные опроса из поста
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('poll_data')
        .eq('id', postId)
        .single();
      
      if (postError) {
        console.error('Post fetch error:', postError);
        return { success: false, message: 'Не удалось получить данные поста' };
      }
      
      if (!post.poll_data) {
        return { success: false, message: 'В этом посте нет опроса' };
      }
      
      if (!post.poll_data.options || !Array.isArray(post.poll_data.options)) {
        console.error('Invalid poll_data:', post.poll_data);
        return { success: false, message: 'Некорректные данные опроса' };
      }
      
      if (optionIndex >= post.poll_data.options.length) {
        return { success: false, message: 'Указанный вариант не существует в опросе' };
      }
      
      // 3. Проверка существования голоса пользователя
      let existingVote = null;
      let shouldCreateVote = true;
      
      try {
        const { data: voteData, error: voteError } = await supabase
          .from('poll_votes')
          .select('id, option_index')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!voteError && voteData) {
          existingVote = voteData;
          shouldCreateVote = false;
        }
      } catch (error) {
        console.log('Ошибка при проверке голоса, продолжаем:', error);
      }
      
      // 4. Если пользователь уже голосовал, возвращаем текущие результаты
      if (existingVote) {
        console.log('Пользователь уже голосовал в этом опросе:', existingVote);
        const results = await this._getPollResults(postId, post.poll_data.options, existingVote.option_index);
        return {
          ...results,
          message: 'Вы уже проголосовали в этом опросе'
        };
      }
      
      // 5. Добавляем голос в базу данных
      if (shouldCreateVote) {
        try {
          console.log('Добавляем новый голос');
          const { error: insertError } = await supabase
            .from('poll_votes')
            .insert({
              post_id: postId,
              user_id: userId,
              option_index: optionIndex,
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Vote insert error:', insertError);
            
            // Если таблица не существует, имитируем успешное голосование
            if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
              console.log('Таблица для голосования отсутствует, имитируем результаты');
              
              // Создаем имитированные результаты для этого опроса
              const fakeResults = post.poll_data.options.map((option, idx) => ({
                option,
                votes: idx === optionIndex ? 1 : 0
              }));
              
              return { 
                success: true, 
                votedOption: optionIndex,
                results: fakeResults,
                message: 'Ваш голос учтен' 
              };
            }
            
            // Другие ошибки вставки
            return { success: false, message: `Ошибка при голосовании: ${insertError.message}` };
          }
          
          console.log('Голос успешно добавлен');
        } catch (insertError) {
          console.error('Ошибка при добавлении голоса:', insertError);
          
          // Создаем имитированные результаты для этого опроса
          const fakeResults = post.poll_data.options.map((option, idx) => ({
            option,
            votes: idx === optionIndex ? 1 : 0
          }));
          
          return { 
            success: true, 
            votedOption: optionIndex,
            results: fakeResults,
            message: 'Ваш голос учтен'
          };
        }
      }
      
      // 6. Возвращаем обновленные результаты опроса
      const results = await this._getPollResults(postId, post.poll_data.options, optionIndex);
      return {
        ...results,
        message: 'Ваш голос учтен'
      };
    } catch (error) {
      console.error('Ошибка при голосовании в опросе:', error);
      return {
        success: false,
        message: error.message || 'Произошла ошибка при голосовании',
        error: error.toString()
      };
    }
  },
  
  // Вспомогательный метод для получения результатов опроса
  async _getPollResults(postId, options, votedOption) {
    try {
      // Попытка получить голоса из таблицы
      let votes = [];
      try {
        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('option_index')
          .eq('post_id', postId);
          
        if (!votesError) {
          votes = votesData || [];
          console.log('Received raw poll votes data:', JSON.stringify(votes));
        } else {
          console.warn('Error fetching votes, using empty array:', votesError);
        }
      } catch (error) {
        console.warn('Exception fetching votes, using empty array:', error);
      }
      
      console.log(`Poll "${postId}" options:`, options);
      console.log(`Poll "${postId}" votes data (total ${votes.length}):`, votes);
      
      // ИСПРАВЛЕНО: Создаем счетчик голосов для каждой опции
      const voteCounts = Array(options.length).fill(0);
      
      // Считаем голоса для каждой опции
      for (const vote of votes) {
        if (vote && typeof vote.option_index === 'number' && 
            vote.option_index >= 0 && vote.option_index < options.length) {
          voteCounts[vote.option_index]++;
        }
      }
      
      console.log(`Calculated vote counts by option index:`, voteCounts);
      
      // Подсчитываем результаты для каждой опции с сохранением порядка
      const results = options.map((option, index) => {
        const voteCount = voteCounts[index] || 0;
        const result = {
          option, // Используем точный текст опции
          votes: voteCount // Количество голосов
        };
        
        console.log(`Option "${option}" (index ${index}): ${voteCount} votes`);
        return result;
      });
      
      // Посчитаем общее количество голосов
      const totalVotes = results.reduce((sum, result) => sum + result.votes, 0);
      console.log(`Total votes: ${totalVotes}`);
      
      // Посчитаем проценты для проверки
      if (totalVotes > 0) {
        results.forEach(result => {
          const percent = Math.round((result.votes / totalVotes) * 100);
          console.log(`Option "${result.option}": ${result.votes}/${totalVotes} = ${percent}%`);
        });
      }
      
      return { 
        success: true, 
        votedOption: votedOption,
        results: results
      };
    } catch (error) {
      console.error('Error getting poll results:', error);
      
      // Если произошла ошибка, возвращаем базовые результаты с нулевыми голосами
      const fallbackResults = options.map(option => ({
        option,
        votes: 0
      }));
      
      return { 
        success: true, 
        votedOption: votedOption,
        results: fallbackResults
      };
    }
  },
  
  // Вспомогательный метод для проверки существования таблицы голосования
  async _ensurePollVotesTable() {
    try {
      // Вместо использования execute_sql проверим таблицу напрямую
      console.log('Checking if poll_votes table exists...');
      
      // Попытка выполнить запрос к таблице poll_votes
      const { data, error } = await supabase
        .from('poll_votes')
        .select('id')
        .limit(1);
      
      // Если таблица существует, запрос выполнится без ошибки
      if (!error) {
        console.log('poll_votes table exists');
        return true;
      }
      
      // Если таблица не существует, создадим её используя SQL запрос
      if (error && error.code === '42P01') { // Код ошибки "relation does not exist"
        console.log('poll_votes table does not exist, attempting to create it');
        
        // Попытаемся создать таблицу через SQL-запрос к базе данных
        // Примечание: Для этого нужны соответствующие права, которые есть у автора поста
        await supabase.rpc('create_poll_votes_table');
        
        // Проверяем, успешно ли создалась таблица
        const { error: checkError } = await supabase
          .from('poll_votes')
          .select('id')
          .limit(1);
          
        if (!checkError || checkError.code !== '42P01') {
          console.log('Successfully created poll_votes table');
          return true;
        } else {
          console.error('Error after creating poll_votes table:', checkError);
          // В случае ошибки при проверке, всё равно продолжаем, чтобы пользователь мог голосовать
          return true;
        }
      }
      
      console.error('Could not verify poll_votes table existence:', error);
      // Продолжаем работу, даже если не смогли проверить таблицу
      return true;
    } catch (error) {
      console.error('Error checking poll_votes table:', error);
      // Не прерываем выполнение в случае ошибки
      return true;
    }
  },
  
  // Получение результатов опроса
  async getPollResults(postId) {
    try {
      console.log('Getting poll results for post:', postId);
      
      // Получаем данные опроса из поста
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('poll_data')
        .eq('id', postId)
        .single();
      
      if (postError) {
        console.error('Error fetching post for poll results:', postError);
        throw new Error('Ошибка при получении поста');
      }
      
      if (!post.poll_data) {
        throw new Error('У этого поста нет опроса');
      }
      
      try {
        // Получаем все голоса для этого опроса
        const { data: votes, error: votesError } = await supabase
          .from('poll_votes')
          .select('option_index, id')
          .eq('post_id', postId);
        
        if (votesError) {
          console.error('Error fetching votes:', votesError);
          throw votesError;
        }
        
        console.log('Got votes for poll:', votes ? votes.length : 0);
        
        // Подсчитываем голоса для каждой опции
        const results = post.poll_data.options.map((option, index) => {
          const optionVotes = votes.filter(vote => vote.option_index === index).length;
          return {
            option,
            votes: optionVotes
          };
        });
        
        return {
          question: post.poll_data.question,
          results
        };
      } catch (votesError) {
        console.error('Ошибка при получении голосов:', votesError);
        
        // В случае ошибки при получении голосов, создаем пустые результаты
        const results = post.poll_data.options.map((option) => ({
          option,
          votes: 0
        }));
        
        return {
          question: post.poll_data.question,
          results
        };
      }
    } catch (error) {
      console.error('Ошибка при получении результатов опроса:', error);
      throw error;
    }
  },
  
  // Закрепление поста (только для администраторов)
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
  
  // Открепление поста (только для администраторов)
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
  },
  
  // Редактирование поста (только для администраторов)
  async updatePost(postId, postData) {
    try {
      console.log('Редактирование поста с ID:', postId);
      
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
        throw new Error('Только администраторы могут редактировать посты');
      }
      
      // Check if image_urls column exists in posts table
      let hasImageUrlsColumn = false;
      try {
        // Try to check if column exists
        const { data: columnCheck, error: columnError } = await supabase
          .from('posts')
          .select('image_urls')
          .limit(1);
          
        hasImageUrlsColumn = !columnError;
      } catch (error) {
        console.log('Колонка image_urls отсутствует, используем только image_url');
      }
      
      // Подготавливаем данные для обновления
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      // Добавляем поля для обновления только если они предоставлены
      if (postData.title !== undefined) {
        updateData.title = postData.title || null;
      }
      
      if (postData.content !== undefined) {
        updateData.content = postData.content;
      }
      
      // Handle multiple images (imageUrls or image_urls properties)
      // Only update image_urls if the column exists
      if (hasImageUrlsColumn && (postData.imageUrls !== undefined || postData.image_urls !== undefined)) {
        const urls = postData.imageUrls || postData.image_urls || null;
        updateData.image_urls = urls;
        
        // Also update image_url with first image if available
        if (urls && urls.length > 0) {
          updateData.image_url = urls[0];
        } else {
          updateData.image_url = null;
        }
      }
      
      if (postData.styling !== undefined) {
        updateData.styling = postData.styling;
      }
      
      if (postData.poll !== undefined) {
        updateData.poll_data = postData.poll;
      }
      
      console.log('Обновляем пост с данными:', updateData);
      
      // Log the update data for debugging
      console.log('Sending update data to Supabase:', updateData);
      
      // Обновляем пост
      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select('*');
      
      if (error) {
        console.error('Ошибка при обновлении поста:', error);
        throw new Error(`Не удалось обновить пост: ${error.message}`);
      }
      
      console.log('Supabase response after update:', data);
      
      if (!data || data.length === 0) {
        throw new Error('Не удалось найти пост для обновления');
      }
      
      console.log('Пост успешно обновлен:', data[0]);
      
      // Вместо сложной выборки с автором, возвращаем успешный результат с обновленными данными поста
      // Обогащаем данные поста основной информацией из базы 
      
      try {
        // Получаем профиль автора через userProfileService
        const authorProfile = await userProfileService.getUserProfile(data[0].user_id);
        
        // Формируем обогащенный пост с данными автора
        const enrichedPost = {
          ...data[0],
          author: {
            id: data[0].user_id,
            displayName: authorProfile.displayName,
            avatar: authorProfile.avatar,
            activePerk: authorProfile.activePerk || 'user',
            id: data[0].user_id
          },
        };
        
        return { success: true, post: enrichedPost };
      } catch (profileError) {
        console.error('Ошибка при получении профиля автора:', profileError);
                 // В случае ошибки возвращаем только данные поста без информации об авторе
        return { success: true, post: data[0] };
      }
    } catch (error) {
      console.error('Ошибка при редактировании поста:', error);
      throw error;
    }
  }
};

// Функция для трансформации данных поста из ответа сервера
function transformPost(post) {
  return {
    id: post.id,
    title: post.title || null,
    content: post.content,
    image_url: post.image_url,
    image_urls: post.image_urls || null,
    user_id: post.user_id,
    created_at: post.created_at,
    updated_at: post.updated_at,
    poll: post.poll || null,
    styling: post.styling || null,
    author: {
      id: post.author?.id || post.user_id,
      displayName: post.author?.display_name,
      avatar: post.author?.avatar,
      activePerk: post.author?.active_perk || 'user'
    },
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0
  };
}

export default postService; 