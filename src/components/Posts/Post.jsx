import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '../../firebase/config';
import CommentList from './CommentList';
import CreateComment from './CreateComment';
import './Posts.css';
import { Link } from 'react-router-dom';
import HtmlContent from '../common/HtmlContent';
import { FaCrown, FaStar, FaTag, FaUser, FaHeart, FaRegHeart, FaComment, FaTrash } from 'react-icons/fa';
import useUserData from '../../hooks/useUserData';
import { postsApi, likesApi, pollsApi, usersApi } from '../../services/api';

// Компонент для отображения опроса
const Poll = ({ poll, postId, currentUser, style }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [results, setResults] = useState(poll.results || {});

  useEffect(() => {
    // При инициализации проверяем, голосовал ли пользователь
    const checkUserVote = async () => {
      if (!currentUser) return;
      
      try {
        const voteData = await pollsApi.getMyVote(postId);
        if (voteData && voteData.optionId) {
          setHasVoted(true);
          setSelectedOption(voteData.optionId);
        }
      } catch (error) {
        console.error('Error checking user vote:', error);
      }
    };
    
    // Получаем текущие результаты опроса
    const getPollResults = async () => {
      try {
        const resultsData = await pollsApi.getResults(postId);
        setResults(resultsData);
      } catch (error) {
        console.error('Error getting poll results:', error);
      }
    };
    
    checkUserVote();
    getPollResults();
  }, [currentUser, postId, poll]);

  const handleVote = async (option) => {
    if (!currentUser || hasVoted) return;

    try {
      await pollsApi.vote(postId, option);
      setHasVoted(true);
      setSelectedOption(option);
      
      // Получаем обновленные результаты
      const updatedResults = await pollsApi.getResults(postId);
      setResults(updatedResults);
    } catch (error) {
      console.error('Error voting in poll:', error);
    }
  };

  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

  return (
    <div className="poll" style={{ fontFamily: style?.fontFamily }}>
      <div className="poll-options">
        {poll.options.map((option, index) => {
          const votes = results[option] || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isSelected = selectedOption === option;

          return (
            <div
              key={index}
              className={`poll-option ${hasVoted ? 'voted' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => !hasVoted && handleVote(option)}
              style={{ color: style?.textColor }}
            >
              <div className="poll-option-content">
                <div className="poll-option-text">
                  {option}
                  {isSelected && <span className="selected-check">✓</span>}
                </div>
                {hasVoted && (
                  <div className="poll-option-result">
                    <div className="poll-option-bar" style={{ width: `${percentage}%` }} />
                    <div className="poll-option-stats">
                      <span>{votes} голосов</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="poll-total">
        Всего голосов: {totalVotes}
      </div>
    </div>
  );
};

const Post = ({ post, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pollResults, setPollResults] = useState(post.poll?.results || {});
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState([]);
  
  const { userData: currentUserData, loading: userDataLoading } = useUserData(currentUserId);
  const isCurrentUserAdmin = currentUserData?.isAdmin || false;

  // Получаем стили из поста
  const postStyle = post.style || {};
  const titleColor = postStyle.titleColor || '#000000';
  const textColor = postStyle.textColor || '#000000';
  const fontFamily = postStyle.fontFamily || 'Arial';

  // Загрузка данных автора поста
  useEffect(() => {
    const loadUserData = async () => {
      if (post.authorId) {
        try {
          const authorData = await usersApi.getUser(post.authorId);
          setUserData(authorData);
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      }
    };

    loadUserData();
    setIsLoading(false);
  }, [post.authorId]);

  // Получаем текущего пользователя
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  // Проверяем, является ли пользователь администратором
  useEffect(() => {
    if (!currentUserId) {
      setIsAdmin(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const userData = await usersApi.getUser(currentUserId);
        setIsAdmin(userData?.isAdmin === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUserId]);

  // Отслеживаем изменения в количестве комментариев
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!post.id) return;
      
      try {
        const postData = await postsApi.getPost(post.id);
        if (postData) {
          setCommentsCount(postData.commentsCount || 0);
          setLikesCount(postData.likesCount || 0);
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
      }
    };
    
    fetchPostDetails();
    
    // Запускаем периодическое обновление данных поста
    const intervalId = setInterval(fetchPostDetails, 30000); // каждые 30 секунд
    
    return () => clearInterval(intervalId);
  }, [post.id]);

  // Проверяем, лайкнул ли пользователь пост
  useEffect(() => {
    if (!currentUserId || !post.id) return;

    const checkLikeStatus = async () => {
      try {
        const likeStatus = await likesApi.isPostLiked(post.id);
        setIsLiked(likeStatus.liked === true);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [currentUserId, post.id]);

  // Функция для лайка/анлайка поста
  const handleLike = useCallback(async () => {
    if (!currentUserId || isLikeProcessing) return;

    setIsLikeProcessing(true);
    
    try {
      if (isLiked) {
        await likesApi.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likesApi.likePost(post.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLikeProcessing(false);
    }
  }, [currentUserId, isLiked, isLikeProcessing, post.id]);

  // Функция для удаления поста
  const handleDelete = useCallback(async () => {
    if (!currentUserId || (!isAdmin && post.authorId !== currentUserId)) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;
    
    setIsDeleting(true);
    
    try {
      await postsApi.deletePost(post.id);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Не удалось удалить пост. Пожалуйста, попробуйте позже.');
    } finally {
      setIsDeleting(false);
    }
  }, [currentUserId, isAdmin, onDelete, post.authorId, post.id]);

  const getAuthorClassName = useCallback(() => {
    if (!userData) return 'author';
    
    if (userData.isAdmin) return 'author admin';
    if (userData.isEarlyUser) return 'author early-user';
    if (userData.customTitle) return 'author custom-title';
    return 'author';
  }, [userData]);

  const getAuthorIcon = useCallback(() => {
    if (!userData) return <FaUser className="privilege-icon" style={{ color: '#2c3e50' }} />;
    
    if (userData.isAdmin) return <FaCrown className="privilege-icon" style={{ color: '#FFD700' }} />;
    if (userData.isEarlyUser) return <FaStar className="privilege-icon" style={{ color: '#FF4444' }} />;
    if (userData.customTitle) return <FaTag className="privilege-icon" style={{ color: '#4A90E2' }} />;
    return <FaUser className="privilege-icon" style={{ color: '#2c3e50' }} />;
  }, [userData]);

  const handleCommentCountChange = useCallback((count) => {
    setCommentsCount(count);
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'только что';
    }
    
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${getMinutesText(minutes)} назад`;
    }
    
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${getHoursText(hours)} назад`;
    }
    
    return postDate.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getMinutesText = (minutes) => {
    if (minutes === 1) return 'минуту';
    if (minutes >= 2 && minutes <= 4) return 'минуты';
    return 'минут';
  };

  const getHoursText = (hours) => {
    if (hours === 1) return 'час';
    if (hours >= 2 && hours <= 4) return 'часа';
    return 'часов';
  };

  const handleVote = useCallback((optionIndex) => {
    console.log(`User voted for option ${optionIndex}`);
  }, []);

  const handleCommentAdded = useCallback(() => {
    setShowComments(true);
  }, []);

  // Мемоизируем компоненты комментариев
  const memoizedCommentList = useMemo(() => (
    <CommentList 
      postId={post.id} 
      currentUserId={currentUserId}
      isAdmin={isCurrentUserAdmin}
      onCommentCountChange={handleCommentCountChange}
    />
  ), [post.id, currentUserId, isCurrentUserAdmin, handleCommentCountChange]);

  const memoizedCreateComment = useMemo(() => (
    <CreateComment postId={post.id} />
  ), [post.id]);

  // Мемоизируем секцию комментариев
  const commentsSection = useMemo(() => (
    <div className="comments-section">
      {memoizedCreateComment}
      {memoizedCommentList}
    </div>
  ), [memoizedCreateComment, memoizedCommentList]);

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="post" style={{
      fontFamily: fontFamily
    }}>
      <div className="post-header">
        <h2 className="post-title" style={{
          color: titleColor,
          fontFamily: fontFamily
        }}>{post.title}</h2>
        {isAdmin && (
          <button className="delete-button" onClick={handleDelete}>
            <FaTrash />
          </button>
        )}
      </div>
      
      <div className="post-content" style={{
        color: textColor,
        fontFamily: fontFamily
      }}>
        {post.content}
      </div>
      
      {post.imageUrl && (
        <div className="post-image">
          <img src={post.imageUrl} alt="Post image" />
        </div>
      )}
      
      {post.isPoll && (
        <Poll 
          poll={post.poll} 
          postId={post.id} 
          currentUser={auth.currentUser}
          style={{
            textColor: textColor,
            fontFamily: fontFamily
          }}
        />
      )}

      <div className="post-meta">
        <div className="author-info">
          <span className={`author ${getAuthorClassName()}`}>
            {getAuthorIcon()}
            {post.authorName}
          </span>
          <span className="post-date">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      <div className="post-footer">
        <div className="post-info">
          <button 
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span className="like-count">{likesCount}</span>
          </button>
          <button 
            className="comment-button"
            onClick={() => setShowComments(!showComments)}
          >
            <FaComment />
            <span className="comment-count">{commentsCount}</span>
          </button>
        </div>
      </div>

      {showComments && commentsSection}
    </div>
  );
};

export default Post; 