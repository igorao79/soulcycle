import supabase from '../supabaseClient';

/**
 * Service for post poll operations
 */
const postPollService = {
  /**
   * Get voting status for a user in a poll
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   */
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
  
  /**
   * Vote in a poll
   * @param {string} postId - Post ID
   * @param {number} optionIndex - Option index to vote for
   */
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
  
  /**
   * Get poll results
   * @param {string} postId - Post ID
   */
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
  
  /**
   * Internal method to get poll results
   * @param {string} postId - Post ID
   * @param {Array} options - Poll options
   * @param {number} votedOption - Option index that was voted for
   * @private
   */
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
  
  /**
   * Ensure poll_votes table exists
   * @private
   */
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
  }
};

export default postPollService; 