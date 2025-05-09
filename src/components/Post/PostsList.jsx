import React, { useState, useEffect } from 'react';
import postService from '../../services/postService';
import PostItem from './PostItem';
import CreatePostForm from './CreatePostForm';
import RulesModal from '../Rules/RulesModal';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Post.module.scss';
import { 
  FiMessageSquare, FiRefreshCw, FiLoader, FiAlertCircle, 
  FiFileText, FiInbox, FiBookOpen
} from 'react-icons/fi';

const PostsList = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  
  // Проверка, является ли пользователь администратором
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // Загрузка постов
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsData = await postService.getPosts();
      
      // Посты уже отсортированы по серверу (закрепленные сверху, затем по дате)
      setPosts(postsData);
      setError('');
    } catch (err) {
      console.error('Ошибка при загрузке постов:', err);
      setError('Не удалось загрузить посты. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  // Загружаем посты при монтировании компонента или при обновлении
  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);
  
  // Обработчик создания нового поста
  const handlePostCreated = (newPost) => {
    // Добавляем новый пост с учетом закрепления
    if (newPost.is_pinned) {
      // Если пост закреплен, добавляем его в начало
      setPosts([newPost, ...posts]);
    } else {
      // Если пост не закреплен, добавляем его после закрепленных
      const pinnedPosts = posts.filter(post => post.is_pinned);
      const unpinnedPosts = posts.filter(post => !post.is_pinned);
      setPosts([...pinnedPosts, newPost, ...unpinnedPosts]);
    }
    
    // Обновляем счетчики лайков и просмотров для всех постов с задержкой
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 2000);
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
    setRefreshTrigger(prev => prev + 1);
  };

  // Обработчик открытия/закрытия модального окна с правилами
  const toggleRulesModal = () => {
    setIsRulesModalOpen(prev => !prev);
  };
  
  return (
    <div className={styles.postsContainer}>
      <div className={styles.postsHeader}>
        <h2>
          <FiFileText /> Лента постов
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
            {loading ? <FiLoader /> : <FiRefreshCw />} Обновить
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
      
      {loading ? (
        <div className={styles.loading}>
          <FiLoader /> Загрузка постов...
        </div>
      ) : posts.length > 0 ? (
        <div className={styles.postsList}>
          {posts.map(post => (
            <PostItem 
              key={post.id} 
              post={post} 
              onLikeToggle={handleLikeToggle}
              onDelete={handlePostDelete}
              onPinChange={handlePinChange}
            />
          ))}
        </div>
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