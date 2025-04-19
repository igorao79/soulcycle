import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaCrown, FaStar, FaTag, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import './Posts.css';
import { commentsApi, usersApi } from '../../services/api';

const CommentList = ({ postId, currentUserId, isAdmin, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [userDataCache, setUserDataCache] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Мемоизируем функцию форматирования даты
  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Мемоизируем функцию получения класса автора
  const getAuthorClassName = useCallback((userData) => {
    if (!userData) return 'comment-author';
    if (userData.isAdmin) return 'comment-author admin';
    if (userData.isEarlyUser) return 'comment-author early-user';
    if (userData.customTitle) return 'comment-author custom-title';
    return 'comment-author';
  }, []);

  // Мемоизируем функцию получения иконки автора
  const getAuthorIcon = useCallback((userData) => {
    if (!userData) return <FaUser className="privilege-icon" />;
    if (userData.isAdmin) return <FaCrown className="privilege-icon" />;
    if (userData.isEarlyUser) return <FaStar className="privilege-icon" />;
    if (userData.customTitle) return <FaTag className="privilege-icon" />;
    return <FaUser className="privilege-icon" />;
  }, []);

  // Функция для получения данных пользователя
  const getUserData = useCallback(async (userId) => {
    if (!userId) return {};
    
    if (userDataCache[userId]) {
      return userDataCache[userId];
    }

    try {
      const userData = await usersApi.getUser(userId);
      
      setUserDataCache(prev => ({
        ...prev,
        [userId]: userData
      }));
      
      return userData;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return {};
    }
  }, [userDataCache]);

  // Загрузка комментариев
  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    const fetchComments = async () => {
      try {
        const commentsData = await commentsApi.getComments(postId, { orderBy: 'createdAt:desc' });
        
        const enhancedComments = [];
        
        for (const comment of commentsData) {
          const userData = await getUserData(comment.authorId);
          
          enhancedComments.push({
            ...comment,
            createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
            userData: {
              isAdmin: userData.isAdmin || false,
              isEarlyUser: userData.isEarlyUser || false,
              customTitle: userData.customTitle || null
            }
          });
        }
        
        setComments(enhancedComments);
        if (onCommentCountChange) {
          onCommentCountChange(enhancedComments.length);
        }
        setError('');
        setRetryCount(0);
      } catch (err) {
        console.error('Error processing comments:', err);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setError(`Ошибка при загрузке комментариев. Попытка ${retryCount + 1} из ${MAX_RETRIES}...`);
        } else {
          setError('Не удалось загрузить комментарии. Пожалуйста, обновите страницу.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [postId, getUserData, onCommentCountChange, retryCount]);

  // Обработчик удаления комментария
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!currentUserId || (!isAdmin && comments.find(c => c.id === commentId)?.authorId !== currentUserId)) {
      return;
    }

    try {
      await commentsApi.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (onCommentCountChange) {
        onCommentCountChange(comments.length - 1);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  }, [comments, currentUserId, isAdmin, onCommentCountChange, postId]);

  // Начало редактирования комментария
  const handleStartEdit = useCallback((comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  }, []);

  // Отмена редактирования
  const handleCancelEdit = useCallback(() => {
    setEditingComment(null);
    setEditText('');
  }, []);

  // Сохранение отредактированного комментария
  const handleSaveEdit = useCallback(async (commentId) => {
    if (!editText.trim()) return;

    try {
      await commentsApi.updateComment(postId, commentId, editText);
      
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: editText } : c
      ));
      
      setEditingComment(null);
      setEditText('');
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  }, [editText, postId]);

  if (loading) return <div className="loading-comments">Загрузка комментариев...</div>;
  if (error) return <div className="error-message">{error}</div>;

  if (comments.length === 0) {
    return <div className="no-comments">Пока нет комментариев. Будьте первым!</div>;
  }

  return (
    <div className="comment-list">
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <div className="comment-header">
            <div className={getAuthorClassName(comment.userData)}>
              {getAuthorIcon(comment.userData)}
              <span>{comment.authorName}</span>
            </div>
            <div className="comment-date">{formatDate(comment.createdAt)}</div>
          </div>
          
          {editingComment === comment.id ? (
            <div className="edit-comment">
              <textarea 
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="edit-comment-input"
              />
              <div className="edit-actions">
                <button 
                  onClick={() => handleSaveEdit(comment.id)}
                  disabled={!editText.trim()}
                  className="save-btn"
                >
                  Сохранить
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="cancel-btn"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-content">{comment.content}</div>
          )}
          
          {(isAdmin || currentUserId === comment.authorId) && editingComment !== comment.id && (
            <div className="comment-actions">
              {currentUserId === comment.authorId && (
                <button 
                  onClick={() => handleStartEdit(comment)}
                  className="edit-btn"
                >
                  <FaEdit /> Редактировать
                </button>
              )}
              <button 
                onClick={() => handleDeleteComment(comment.id)}
                className="delete-btn"
              >
                <FaTrash /> Удалить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentList; 