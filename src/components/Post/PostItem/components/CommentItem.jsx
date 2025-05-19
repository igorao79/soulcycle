import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiCornerDownRight, FiTrash2, FiClock, FiLoader, FiSend, FiX, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../../../contexts/AuthContext';
import commentService from '../../../../services/commentService';
import filterBadWords from '../../../../utils/filterBadWords';
import OptimizedAvatar from '../../../shared/OptimizedAvatar';
import ConfirmDialog from '../../../shared/ConfirmDialog';
import styles from '../../Post.module.scss';
import perkStyles from '../../../../styles/Perks.module.scss';
import { formatRelativeTime } from '../utils/helpers';
import {
  CommentActionsDropdown, DropdownToggle, DropdownMenu, DropdownItem,
  commentResponsiveStyles, mobileCommentResponsiveStyles, slideActionStyles
} from '../styles/CommentStyles';
import { WarningMessage, animationVariants } from '../styles/PostStyles';
import Notification from '../../../common/Notification';

function CommentItem({ comment, onReply, onDelete }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplyDeleteConfirm, setShowReplyDeleteConfirm] = useState({});
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swiped, setSwiped] = useState(false);
  const commentRef = useRef(null);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteError, setShowDeleteError] = useState(false);
  
  // Проверяем, является ли пользователь администратором
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  const isCommentOwner = user && user.id === comment.user_id;
  const canDeleteComment = isAdmin || isCommentOwner;
  
  // Handle touch events for swipeable actions
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    if (touchStart && touchEnd) {
      const distance = touchStart - touchEnd;
      
      // Only allow right-to-left swipe (negative distance)
      if (distance > 20 && distance < 120) {
        const transform = -distance;
        if (commentRef.current) {
          commentRef.current.style.transform = `translateX(${transform}px)`;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    
    // If swiped far enough, show action buttons
    if (distance > 70) {
      setSwiped(true);
    } else {
      setSwiped(false);
      if (commentRef.current) {
        commentRef.current.style.transform = 'translateX(0)';
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // Reset swipe state when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commentRef.current && !commentRef.current.contains(e.target)) {
        setSwiped(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleReplyClick = () => {
    if (!isAuthenticated) {
      setShowAuthWarning('reply');
      return;
    }
    
    // Переключаем состояние формы ответа
    setShowReplyForm(prevState => !prevState);
    
    // Если форма открывается, то фокусируемся на текстовом поле
    if (!showReplyForm) {
      setTimeout(() => {
        const textareas = document.querySelectorAll(`.${styles.replyForm} textarea`);
        if (textareas.length > 0) {
          textareas[textareas.length - 1].focus();
        }
      }, 100);
    }
  };
  
  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyContent('');
  };
  
  const openDeleteConfirm = () => {
    if (!canDeleteComment) return;
    setShowDeleteConfirm(true);
  };
  
  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };
  
  const handleDeleteComment = async () => {
    if (!canDeleteComment) return;
    
    try {
      setIsDeleting(true);
      const result = await commentService.deleteComment(comment.id, user.id);
      
      if (result && result.success) {
        onDelete(comment.id);
        setShowDeleteConfirm(false);
      } else {
        throw new Error('Не удалось удалить комментарий. Попробуйте позже.');
      }
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      setDeleteError(error.message || 'Неизвестная ошибка');
      setShowDeleteError(true);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Функции для работы с ответами на комментарии
  const openReplyDeleteConfirm = (replyId) => {
    setShowReplyDeleteConfirm(prev => ({
      ...prev,
      [replyId]: true
    }));
  };
  
  const closeReplyDeleteConfirm = (replyId) => {
    setShowReplyDeleteConfirm(prev => ({
      ...prev,
      [replyId]: false
    }));
  };
  
  const handleDeleteReply = async (replyId, userId) => {
    const isReplyOwner = user && user.id === userId;
    const canDeleteReply = isAdmin || isReplyOwner;
    
    if (!canDeleteReply) return;
    
    try {
      const result = await commentService.deleteComment(replyId, user?.id);
      
      if (result && result.success) {
        onDelete(replyId);
        closeReplyDeleteConfirm(replyId);
      } else {
        throw new Error('Не удалось удалить ответ. Попробуйте позже.');
      }
    } catch (error) {
      console.error('Ошибка при удалении ответа:', error);
      setDeleteError(error.message || 'Неизвестная ошибка');
      setShowDeleteError(true);
      closeReplyDeleteConfirm(replyId);
    }
  };
  
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      return;
    }
    
    try {
      setIsSubmittingReply(true);
      
      // Применяем фильтр нецензурных слов к тексту ответа, передавая объект пользователя
      const filteredContent = filterBadWords(replyContent, user);
      
      await onReply(comment.id, filteredContent);
      
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  return (
    <div className={styles.commentItem}>
      {/* Inject responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: commentResponsiveStyles }} />
      <style dangerouslySetInnerHTML={{ __html: mobileCommentResponsiveStyles }} />
      <style dangerouslySetInnerHTML={{ __html: slideActionStyles }} />
      
      <div 
        ref={commentRef}
        className={`commentInner ${swiped ? 'swiped' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.commentHeader}>
          <div className={styles.commentAuthorAvatar}>
            <OptimizedAvatar src={comment.author.avatar} alt={comment.author.displayName} className={styles.avatar} />
          </div>
          <div className={styles.commentAuthorInfo}>
            <Link to={`/profile/${comment.user_id}`} className={styles.commentAuthor}>
              <span 
                className={
                  comment.author.activePerk === 'early_user' 
                    ? perkStyles.earlyUserPerk
                    : comment.author.activePerk === 'sponsor' 
                    ? perkStyles.sponsorPerk
                    : comment.author.activePerk === 'admin' 
                    ? perkStyles.adminPerk
                    : perkStyles.userPerk
                }
                style={{
                  display: 'inline-block',
                  margin: 0,
                  padding: 0
                }}
              >
                {comment.author.displayName}
              </span>
            </Link>
          </div>
        </div>
        
        <div className={styles.commentContent}>{comment.content}</div>
        
        <div className={styles.commentDate}>
          <FiClock /> {formatRelativeTime(comment.created_at)}
        </div>
        
        {/* Унифицированные кнопки действий */}
        <div className={styles.commentActions}>
          <button 
            className={styles.replyButton}
            onClick={handleReplyClick}
          >
            <FiCornerDownRight /> Ответить
          </button>
          
          {canDeleteComment && (
            <button
              className={styles.deleteCommentButton}
              onClick={openDeleteConfirm}
              disabled={isDeleting}
            >
              <FiTrash2 /> {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteComment}
        title="Удаление комментария"
        message="Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        isDanger={true}
      />
      
      {/* Delete error dialog */}
      <ConfirmDialog
        isOpen={showDeleteError}
        onClose={() => setShowDeleteError(false)}
        onConfirm={() => setShowDeleteError(false)}
        title="Ошибка удаления"
        message={`Не удалось удалить комментарий: ${deleteError}`}
        confirmText="Понятно"
        hideCancel={true}
      />
      
      {/* Форма для ответа на комментарий */}
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} className={styles.replyForm}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Напишите ответ..."
            disabled={isSubmittingReply}
          />
          <div className={styles.replyFormActions}>
            <button 
              type="button" 
              onClick={handleCancelReply} 
              className={styles.cancelReplyButton}
              disabled={isSubmittingReply}
            >
              <FiX /> Отмена
            </button>
            <button 
              type="submit" 
              className={styles.submitReplyButton}
              disabled={isSubmittingReply}
            >
              {isSubmittingReply ? (
                <>
                  <FiLoader /> Отправка...
                </>
              ) : (
                <>
                  <FiSend /> Ответить
                </>
              )}
            </button>
          </div>
        </form>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {comment.replies.map(reply => {
            const isReplyOwner = user && user.id === reply.user_id;
            const canDeleteReply = isAdmin || isReplyOwner;
            
            return (
              <div key={reply.id} className={`${styles.commentItem} ${styles.commentReply}`}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentAuthorAvatar}>
                    <OptimizedAvatar src={reply.author.avatar} alt={reply.author.displayName} className={styles.avatar} />
                  </div>
                  <div className={styles.commentAuthorInfo}>
                    <Link to={`/profile/${reply.user_id}`} className={styles.commentAuthor}>
                      <span 
                        className={
                          reply.author.activePerk === 'early_user' 
                            ? perkStyles.earlyUserPerk
                            : reply.author.activePerk === 'sponsor' 
                            ? perkStyles.sponsorPerk
                            : reply.author.activePerk === 'admin' 
                            ? perkStyles.adminPerk
                            : perkStyles.userPerk
                        }
                        style={{
                          display: 'inline-block',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        {reply.author.displayName}
                      </span>
                    </Link>
                  </div>
                </div>
                
                <div className={styles.commentContent}>{reply.content}</div>
                
                <div className={styles.commentDate}>
                  <FiClock /> {formatRelativeTime(reply.created_at)}
                </div>
                
                {canDeleteReply && (
                  <div className={styles.commentActions}>
                    <button
                      className={styles.deleteCommentButton}
                      onClick={() => setShowReplyDeleteConfirm({
                        ...showReplyDeleteConfirm,
                        [reply.id]: true
                      })}
                    >
                      <FiTrash2 /> Удалить
                    </button>
                  </div>
                )}
                
                {/* Reply Delete confirmation dialog */}
                <ConfirmDialog
                  isOpen={showReplyDeleteConfirm[reply.id] || false}
                  onClose={() => closeReplyDeleteConfirm(reply.id)}
                  onConfirm={() => handleDeleteReply(reply.id, reply.user_id)}
                  title="Удаление ответа"
                  message="Вы уверены, что хотите удалить этот ответ? Это действие нельзя отменить."
                  confirmText="Удалить"
                  cancelText="Отмена"
                  isDanger={true}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {showAuthWarning && (
        <Notification
          type="info"
          message="Войдите, чтобы ответить на комментарий"
          show={!!showAuthWarning}
          onClose={() => setShowAuthWarning(false)}
        />
      )}
    </div>
  );
}

export default CommentItem; 
 