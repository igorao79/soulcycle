import React, { useState, useEffect, useRef, useCallback } from 'react';
import postService from '../../services/postService';
import PostItem from './PostItem/index.jsx';
import CreatePostForm from './CreatePostForm';
import RulesModal from '../Rules/RulesModal';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Post.module.scss';
import { 
  FiMessageSquare, FiRefreshCw, FiLoader, FiAlertCircle, 
  FiFileText, FiInbox, FiBookOpen
} from 'react-icons/fi';

const POST_LIMIT = 10; // Limit posts per page

const PostsList = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Ref for intersection observer
  const observer = useRef();
  // Ref for the loader element
  const loaderRef = useRef();
  
  // Проверка, является ли пользователь администратором
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // Загрузка постов - обновлено для поддержки пагинации
  const fetchPosts = async (pageNum = 1, shouldAppend = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await postService.getPosts(pageNum, POST_LIMIT);
      
      if (response && response.posts) {
        if (shouldAppend) {
          // Append new posts to existing list
          setPosts(prev => [...prev, ...response.posts]);
        } else {
          // Replace existing posts
          setPosts(response.posts);
        }
        
        // Update pagination info
        setHasMore(response.hasMore);
        setTotalCount(response.totalCount);
        
        setError('');
        
        // Set loading to false immediately
        setLoading(false);
        setLoadingMore(false);
      } else {
        throw new Error('Не удалось получить данные постов');
      }
    } catch (err) {
      console.error('Ошибка при загрузке постов:', err);
      setError('Не удалось загрузить посты. Попробуйте позже.');
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Function to load more posts
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  }, [page, loadingMore, hasMore]);
  
  // Intersection Observer setup for infinite scrolling
  useEffect(() => {
    // Disconnect previous observer if exists
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // If the loader is visible and we're not already loading and we have more posts
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        loadMorePosts();
      }
    }, { 
      rootMargin: '100px',
      threshold: 0.1 
    });
    
    // Observe the loader element
    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.current.observe(currentLoaderRef);
    }
    
    return () => {
      if (currentLoaderRef) {
        observer.current.unobserve(currentLoaderRef);
      }
    };
  }, [loadMorePosts, hasMore, loadingMore, loading]);
  
  // Загружаем посты при монтировании компонента или при обновлении
  useEffect(() => {
    setPage(1); // Reset to first page
    fetchPosts(1, false);
  }, [refreshTrigger]);
  
  // Обработчик создания нового поста
  const handlePostCreated = (newPost) => {
    // Добавляем новый пост в начало списка
    setPosts(prevPosts => {
      // Если пост закреплен, добавляем в начало
      if (newPost.is_pinned) {
        return [newPost, ...prevPosts];
      }
      
      // Если не закреплен, добавляем после закрепленных
      const pinnedPosts = prevPosts.filter(post => post.is_pinned);
      const unpinnedPosts = prevPosts.filter(post => !post.is_pinned);
      return [...pinnedPosts, newPost, ...unpinnedPosts];
    });
    
    // Обновляем общее количество
    setTotalCount(prev => prev + 1);
  };
  
  // Обработчик изменения лайка
  const handleLikeToggle = (postId, isLiked, likesCount) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: likesCount }
          : post
      )
    );
  };
  
  // Обработчик удаления поста
  const handlePostDelete = async (postId) => {
    try {
      // Вызываем API для удаления поста
      const result = await postService.deletePost(postId);
      if (result.success) {
        // Только если запрос успешен, удаляем пост из локального состояния
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        // Уменьшаем общее количество
        setTotalCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
      setError('Не удалось удалить пост. ' + (error.message || 'Попробуйте позже.'));
    }
  };
  
  // Обработчик изменения статуса закрепления
  const handlePinChange = async (postId, isPinned, previouslyPinnedId) => {
    // Обновляем локальное состояние постов
    const updatedPosts = posts.map(post => {
      // Для закрепляемого поста
      if (post.id === postId) {
        return { ...post, is_pinned: isPinned };
      }
      // Если пост был ранее закреплен и мы закрепляем новый
      else if (previouslyPinnedId && post.id === previouslyPinnedId && isPinned) {
        return { ...post, is_pinned: false };
      }
      // Остальные посты
      return post;
    });
    
    // Сортируем посты так, чтобы закрепленные были сверху
    const pinnedPosts = updatedPosts.filter(post => post.is_pinned);
    const unpinnedPosts = updatedPosts.filter(post => !post.is_pinned);
    
    // Внутри каждой группы сортируем по дате создания (новые сверху)
    pinnedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    unpinnedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Объединяем отсортированные группы
    setPosts([...pinnedPosts, ...unpinnedPosts]);
  };
  
  // Обработчик обновления данных
  const handleRefresh = () => {
    setPage(1); // Reset to first page
    setRefreshTrigger(prev => prev + 1);
  };

  // Обработчик открытия/закрытия модального окна с правилами
  const toggleRulesModal = () => {
    setIsRulesModalOpen(prev => !prev);
  };
  
  // Add a handler for post updates
  const handlePostUpdate = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id 
          ? { ...post, ...updatedPost }
          : post
      )
    );
  };
  
  return (
    <div className={styles.postsContainer}>
      <div className={styles.postsHeader}>
        <h2>
          <FiFileText /> Лента постов {totalCount > 0 && `(${posts.length}/${totalCount})`}
        </h2>
        <div className={styles.headerButtons}>
          <button 
            className={styles.rulesButton}
            onClick={toggleRulesModal}
          >
            <FiBookOpen /> Правила
          </button>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? <FiLoader className={styles.spinningLoader} /> : <FiRefreshCw />} Обновить
          </button>
        </div>
      </div>
      
      {/* Отображаем форму создания постов только для администраторов */}
      {isAdmin && <CreatePostForm onPostCreated={handlePostCreated} />}
      
      {error && (
        <div className={styles.errorMessage}>
          <FiAlertCircle /> {error}
        </div>
      )}
      
      {loading && page === 1 ? (
        <div className={styles.loading}>
          <FiLoader /> Загрузка постов...
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className={styles.postsList}>
            {posts.map(post => (
              <PostItem 
                key={post.id} 
                post={post} 
                onLikeToggle={handleLikeToggle}
                onDelete={handlePostDelete}
                onPinChange={handlePinChange}
                onUpdate={handlePostUpdate}
              />
            ))}
          </div>
          
          {/* Loader at the bottom for infinite scrolling */}
          <div ref={loaderRef} className={styles.loadMoreContainer}>
            {loadingMore && (
              <div className={styles.loadMoreSpinner}>
                <FiLoader /> Загрузка старых постов...
              </div>
            )}
            {!hasMore && posts.length >= totalCount && (
              <div className={styles.noMorePosts}>
                Вы загрузили все посты
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.noPosts}>
          <FiInbox />
          <p>Постов пока нет. {isAdmin ? 'Создайте первый пост!' : 'Скоро здесь появится интересный контент!'}</p>
        </div>
      )}

      {/* Модальное окно с правилами */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
};

export default PostsList; 