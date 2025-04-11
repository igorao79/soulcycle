import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FaCrown, FaStar, FaTag, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import './Posts.css';

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
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};
      
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

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('postId', '==', postId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const commentsData = [];
        
        for (const commentDoc of snapshot.docs) {
          const data = commentDoc.data();
          const userData = await getUserData(data.authorId);
          
          commentsData.push({
            id: commentDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            userData: {
              isAdmin: userData.isAdmin || false,
              isEarlyUser: userData.isEarlyUser || false,
              customTitle: userData.customTitle || null
            }
          });
        }
        
        // Сортируем комментарии по дате создания после получения данных
        commentsData.sort((a, b) => b.createdAt - a.createdAt);
        
        setComments(commentsData);
        if (onCommentCountChange) {
          onCommentCountChange(commentsData.length);
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
    }, (error) => {
      console.error('Error in comments snapshot:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setError(`Ошибка при загрузке комментариев. Попытка ${retryCount + 1} из ${MAX_RETRIES}...`);
      } else {
        setError('Не удалось загрузить комментарии. Пожалуйста, обновите страницу.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, onCommentCountChange, getUserData, retryCount]);

  const handleEdit = useCallback((comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  }, []);

  const handleSaveEdit = useCallback(async (commentId) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        content: editText,
        editedAt: new Date()
      });
      setEditingComment(null);
    } catch (error) {
      setError('Ошибка при обновлении комментария');
    }
  }, [editText]);

  const handleDelete = useCallback(async (commentId) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });
    } catch (error) {
      setError('Ошибка при удалении комментария');
    }
  }, [postId]);

  const canModifyComment = useCallback((comment) => {
    return currentUserId === comment.authorId || isAdmin;
  }, [currentUserId, isAdmin]);

  // Мемоизируем список комментариев
  const commentsList = useMemo(() => (
    <div className="comment-list">
      {comments.length === 0 ? (
        <p className="no-comments">Пока нет комментариев. Будьте первым!</p>
      ) : (
        comments.map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <span className={getAuthorClassName(comment.userData)}>
                {getAuthorIcon(comment.userData)} {comment.authorName}
              </span>
              <div className="comment-actions">
                <span className="date">{formatDate(comment.createdAt)}</span>
                {canModifyComment(comment) && (
                  <div className="comment-controls">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(comment)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {editingComment === comment.id ? (
              <div className="comment-edit">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="edit-textarea"
                />
                <div className="edit-actions">
                  <button 
                    className="save-button"
                    onClick={() => handleSaveEdit(comment.id)}
                  >
                    Сохранить
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setEditingComment(null)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="comment-content">
                {comment.content}
                {comment.editedAt && (
                  <span className="edited-mark">(изменено)</span>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  ), [comments, editingComment, editText, getAuthorClassName, getAuthorIcon, formatDate, canModifyComment, handleEdit, handleDelete, handleSaveEdit]);

  if (loading) return <div className="loading">Загрузка комментариев...</div>;
  if (error) return <div className="error">{error}</div>;

  return commentsList;
};

export default CommentList; 