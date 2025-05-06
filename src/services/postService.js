import supabase from './supabaseClient';
import userProfileService from './userProfileService';

const postService = {
  // Получение всех постов с информацией об авторах и счетчиками
  async getPosts() {
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

      // Получаем все посты
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('is_pinned', { ascending: false }) // Сначала закрепленные
        .order('created_at', { ascending: false }); // Затем по дате создания
      
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
            created_at: post.created_at,
            user_id: post.user_id,
            author: {
              displayName: authorProfile.displayName,
              avatar: authorProfile.avatar,
              perks: perks,
              activePerk: activePerk
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
            created_at: post.created_at,
            user_id: post.user_id,
            author: {
              displayName: 'Пользователь',
              avatar: null,
              perks: [],
              activePerk: 'user'
            },
            styling: null,
            likes_count: 0,
            comments_count: 0,
            poll_data: null,
            is_pinned: post.is_pinned || false
          });
        }
      }
      
      return enrichedPosts;
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
        imageUrl,
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
      
      // Подготовленные данные поста
      const newPostData = {
        title: title || null,
        content,
        image_url: imageUrl || null,
        user_id: userId,
        created_at: new Date().toISOString(),
        poll_data: poll || null,
        styling: styling || null,
        is_pinned: isPinned || false
      };
      
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
        author: {
          id: userId,
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          activePerk: authorProfile.activePerk || 'user'
        },
        likes_count: 0,
        comments_count: 0,
        poll_data: data[0].poll_data, // Ensure poll data is included in the response
        is_pinned: data[0].is_pinned || false
      };
      
      console.log('Created post with poll data:', result.poll_data);
      
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
          
          for (const reply of replies) {
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
                  activePerk: replyActivePerk
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
                  activePerk: 'user'
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
              activePerk: commentActivePerk
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
              activePerk: 'user'
            },
            replies: []
          });
        }
      }
      
      return {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        user_id: post.user_id,
        author: {
          displayName: authorProfile.displayName,
          avatar: authorProfile.avatar,
          perks: perks,
          activePerk: activePerk
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
  
  // Голосование в опросе
  async voteInPoll(postId, userId, optionIndex) {
    try {
      // Получаем пост, чтобы проверить опрос
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('poll_data')
        .eq('id', postId)
        .single();
      
      if (postError) throw postError;
      if (!post.poll_data) throw new Error('У этого поста нет опроса');
      
      // Проверяем, существует ли опция
      if (optionIndex < 0 || optionIndex >= post.poll_data.options.length) {
        throw new Error('Неверный индекс опции');
      }
      
      try {
        // Проверяем, голосовал ли пользователь ранее
        const { data: existingVote, error: checkError } = await supabase
          .from('poll_votes')
          .select('id, option_index')
          .eq('post_id', postId)
          .eq('user_id', userId);
        
        if (checkError) throw checkError;
        
        // Если пользователь уже голосовал, обновляем его голос
        if (existingVote && existingVote.length > 0) {
          const { error: updateError } = await supabase
            .from('poll_votes')
            .update({ option_index: optionIndex })
            .eq('id', existingVote[0].id);
          
          if (updateError) throw updateError;
        } else {
          // Сохраняем новый голос пользователя
          const { error: voteError } = await supabase
            .from('poll_votes')
            .insert({
              post_id: postId,
              user_id: userId,
              option_index: optionIndex
            });
          
          if (voteError) throw voteError;
        }
        
        // Получаем обновленные результаты
        const results = await this.getPollResults(postId);
        
        return results;
      } catch (dbError) {
        console.error('Ошибка при работе с базой данных голосов:', dbError);
        
        // Создаем имитацию результатов с одним голосом пользователя
        const fakeResults = {
          question: post.poll_data.question,
          results: post.poll_data.options.map((option, index) => ({
            option,
            votes: index === optionIndex ? 1 : 0
          }))
        };
        
        return fakeResults;
      }
    } catch (error) {
      console.error('Ошибка при голосовании в опросе:', error);
      throw error;
    }
  },
  
  // Получение результатов опроса
  async getPollResults(postId) {
    try {
      // Получаем данные опроса из поста
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('poll_data')
        .eq('id', postId)
        .single();
      
      if (postError) throw postError;
      if (!post.poll_data) throw new Error('У этого поста нет опроса');
      
      try {
        // Получаем все голоса для этого опроса
        const { data: votes, error: votesError } = await supabase
          .from('poll_votes')
          .select('option_index')
          .eq('post_id', postId);
        
        if (votesError) throw votesError;
        
        // Подсчитываем голоса для каждой опции
        const results = post.poll_data.options.map((option, index) => {
          const optionVotes = votes ? votes.filter(vote => vote.option_index === index).length : 0;
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
      
      // Обновляем пост, устанавливая флаг закрепления
      const { data, error } = await supabase
        .from('posts')
        .update({ is_pinned: true })
        .eq('id', postId)
        .select();
      
      if (error) {
        console.error('Ошибка при закреплении поста:', error);
        throw error;
      }
      
      return { success: true, post: data?.[0] };
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
  }
};

// Функция для трансформации данных поста из ответа сервера
function transformPost(post) {
  return {
    id: post.id,
    title: post.title || null,
    content: post.content,
    image_url: post.image_url,
    user_id: post.user_id,
    created_at: post.created_at,
    updated_at: post.updated_at,
    poll: post.poll || null,
    styling: post.styling || null,
    author: {
      id: post.author?.id,
      displayName: post.author?.display_name,
      avatar: post.author?.avatar,
      activePerk: post.author?.active_perk || 'user'
    },
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0
  };
}

export default postService; 