import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { 
  FiHeart, FiMessageSquare, FiClock, FiTrash2, 
  FiSend, FiAlertCircle, FiLoader, FiMessageCircle, 
  FiEdit, FiInfo, FiMinimize2
} from 'react-icons/fi';
import { AiOutlinePushpin } from 'react-icons/ai';

import { useAuth } from '../../../contexts/AuthContext';
import postService from '../../../services/postService';
import commentService from '../../../services/commentService';
import filterBadWords from '../../../utils/filterBadWords';

// Import Components
import PollComponent from './components/PollComponent';
import CommentItem from './components/CommentItem';
import OptimizedImage from './components/OptimizedImage';
import EditPostForm from './components/EditPostForm';
import PollEditForm from './components/PollEditForm';
import ConfirmDialog from '../../shared/ConfirmDialog';
import OptimizedAvatar from '../../shared/OptimizedAvatar';
import ImageLightbox from '../../shared/ImageLightbox';
import Notification from '../../common/Notification';

// Import Styles
import styles from '../Post.module.scss';
import perkStyles from '../../../styles/Perks.module.scss';
import { 
  PinnedPostContainer, PinnedBadge, CommentSection, WarningMessage,
  animationVariants, commentSectionVariants, PinButton
} from './styles/PostStyles';

// Import Utils
import { formatRelativeTime, isDarkColor } from './utils/helpers';

const PostItem = ({ post, onLikeToggle, fullView = false, onDelete, onPinChange, onUpdate }) => {
  // Basic State
  const { user, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(fullView);
  const [isPinned, setIsPinned] = useState(post.is_pinned || false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Comments State
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [directCommentsCount, setDirectCommentsCount] = useState(0);
  const [newComment, setNewComment] = useState('');

  // Loading States
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  
  // UI States
  const [timeAgo, setTimeAgo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState('');
  const [commentError, setCommentError] = useState('');
  // New modal states for poll editing
  const [showPollVotesError, setShowPollVotesError] = useState(false);
  const [showPollCheckError, setShowPollCheckError] = useState(false);

  // Poll States
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOption, setVotedOption] = useState(null);
  const [pollResults, setPollResults] = useState([]);
  const [pollHasVotes, setPollHasVotes] = useState(false);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Check if post has title and content separately
  const hasTitle = post.title && post.title.trim().length > 0;
  
  // Check if user is admin
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // Get post styling
  const styling = post.styling || {};
  const titleColor = styling.titleColor || '#000000';
  const contentColor = styling.contentColor || '#000000';
  const fontFamily = styling.fontFamily || 'inherit';
  
  // Check if colors are dark
  const isTitleDark = isDarkColor(titleColor);
  const isContentDark = isDarkColor(contentColor);
  
  // Check if device is mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Check if post is a poll
  const isPollPost = !!post.poll_data;
  
  // Update mobile status when window size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize(); // Check initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update relative time every 5 minutes instead of every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(formatRelativeTime(post.created_at, isMobile));
    };
    
    updateTime();
    
    const intervalId = setInterval(updateTime, 300000); // every 5 minutes for better performance
    
    return () => clearInterval(intervalId);
  }, [post.created_at, isMobile]);
  
  // Check if user has liked the post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (isAuthenticated && user) {
        try {
          const { liked } = await postService.isLikedByUser(post.id, user.id);
          setIsLiked(liked);
        } catch (error) {
          console.error('Ошибка при проверке статуса лайка:', error);
        }
      }
    };
    
    checkLikeStatus();
  }, [post.id, user, isAuthenticated]);
  
  // Check if user has voted in the poll
  useEffect(() => {
    const checkPollVoteStatus = async () => {
      if (post.poll_data && isAuthenticated && user) {
        try {
          const { hasVoted, option, results } = await postService.getPollVoteStatus(post.id, user.id);
          setHasVoted(hasVoted);
          setVotedOption(option);
          setPollResults(results);
          
          // Check if any option has votes
          const hasVotes = results.some(result => result.votes > 0);
          setPollHasVotes(hasVotes);
        } catch (error) {
          console.error('Ошибка при проверке статуса голосования:', error);
          // Try to get general poll results on error
          try {
            const { results } = await postService.getPollResults(post.id);
            setPollResults(results);
            
            // Check if any option has votes
            const hasVotes = results.some(result => result.votes > 0);
            setPollHasVotes(hasVotes);
          } catch (secondError) {
            console.error('Не удалось получить даже базовые результаты опроса:', secondError);
            // Create fake results if we can't get any data
            if (post.poll_data && post.poll_data.options) {
              const fakeResults = post.poll_data.options.map((option) => ({
                option,
                votes: 0
              }));
              setPollResults(fakeResults);
              setPollHasVotes(false);
            }
          }
        }
      } else if (post.poll_data) {
        // For non-authenticated users, show results only
        try {
          const { results } = await postService.getPollResults(post.id);
          setPollResults(results);
          
          // Check if any option has votes
          const hasVotes = results.some(result => result.votes > 0);
          setPollHasVotes(hasVotes);
        } catch (error) {
          console.error('Ошибка при получении результатов опроса:', error);
          // Create fake results on error
          if (post.poll_data && post.poll_data.options) {
            const fakeResults = post.poll_data.options.map((option) => ({
              option,
              votes: 0
            }));
            setPollResults(fakeResults);
            setPollHasVotes(false);
          }
        }
      }
    };
    
    if (post.poll_data) {
      checkPollVoteStatus();
    }
  }, [post.id, post.poll_data, user, isAuthenticated]);
  
  // Update like count from props
  useEffect(() => {
    setLikesCount(post.likes_count || 0);
  }, [post.likes_count]);
  
  // Update comment count from props
  useEffect(() => {
    setCommentsCount(post.comments_count || 0);
  }, [post.comments_count]);
  
  // Update pin status when prop changes
  useEffect(() => {
    setIsPinned(post.is_pinned || false);
  }, [post.is_pinned]);
  
  // Load comments
  const loadComments = async () => {
    if (comments.length > 0 && !showComments) {
      setShowComments(true);
      setIsLoadingComments(false);
      return;
    }
    
    try {
      setIsLoadingComments(true);
      const commentsList = await commentService.getCommentsByPostId(post.id);
      
      // Count total comments including replies
      let repliesCount = 0;
      commentsList.forEach(comment => {
        if (comment.replies) {
          repliesCount += comment.replies.length;
        }
      });
      
      // Save direct comments count
      setDirectCommentsCount(commentsList.length);
      
      // Save total comments count (direct + replies)
      const totalCount = commentsList.length + repliesCount;
      setCommentsCount(totalCount);
      
      setComments(commentsList);
      setShowComments(true);
    } catch (error) {
      console.error('Ошибка при загрузке комментариев:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  // Like post
  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      setShowAuthWarning('like');
      return;
    }
    
    try {
      // Optimistic UI update
      const newLikedState = !isLiked;
      const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
      
      setIsLiked(newLikedState);
      setLikesCount(newLikesCount > 0 ? newLikesCount : 0);
      
      // Animate like button
      const likeButton = document.querySelector(`#like-${post.id}`);
      if (likeButton) {
        likeButton.classList.add(styles.likeAnimation);
        setTimeout(() => {
          likeButton.classList.remove(styles.likeAnimation);
        }, 1000);
      }
      
      // Send request to server
      const result = await postService.toggleLike(post.id, user.id);
      
      // Update state with real data from server
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      
      // Call callback to update post list
      if (onLikeToggle) {
        onLikeToggle(post.id, result.liked, result.likesCount);
      }
    } catch (error) {
      console.error('Ошибка при обновлении лайка:', error);
      
      // Revert to original state on error
      setIsLiked(!isLiked);
      const resetLikesCount = isLiked ? likesCount + 1 : likesCount - 1;
      setLikesCount(resetLikesCount > 0 ? resetLikesCount : 0);
    }
  };
  
  // Toggle comments
  const toggleComments = () => {
    if (showComments) {
      setShowComments(false);
    } else {
      setIsLoadingComments(true);
      loadComments();
    }
  };
  
  // Vote in poll
  const handlePollVote = async (optionIndex) => {
    if (!isAuthenticated) {
      setShowAuthWarning('poll');
      return;
    }
    
    try {
      const response = await postService.votePoll(post.id, optionIndex);
      
      if (response.success) {
        setHasVoted(true);
        setVotedOption(optionIndex);
        setPollResults(response.results);
        setPollHasVotes(true);
      } else {
        throw new Error(response.message || 'Ошибка при голосовании');
      }
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      alert(`Не удалось проголосовать: ${error.message || 'Неизвестная ошибка'}`);
    }
  };
  
  // Submit new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setCommentError('Войдите, чтобы оставить комментарий');
      return;
    }
    
    if (!newComment.trim()) {
      setCommentError('Комментарий не может быть пустым');
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      setCommentError('');
      
      // Apply profanity filter
      const filteredContent = filterBadWords(newComment, user);
      
      const createdComment = await commentService.createComment({
        content: filteredContent,
        postId: post.id,
        userId: user.id
      });
      
      // Update comments list - add new comment to beginning
      setComments([createdComment, ...comments]);
      
      // Increase direct comments count
      setDirectCommentsCount(prevCount => prevCount + 1);
      
      // Increase total comments count
      setCommentsCount(prevCount => prevCount + 1);
      
      // Clear form
      setNewComment('');
    } catch (error) {
      console.error('Ошибка при создании комментария:', error);
      setCommentError('Не удалось отправить комментарий');
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Reply to comment
  const handleReplyToComment = async (commentId, content) => {
    if (!isAuthenticated) {
      setShowAuthWarning('reply');
      return;
    }
    
    try {
      // Apply profanity filter
      const filteredContent = filterBadWords(content, user);
      
      const reply = await commentService.replyToComment({
        content: filteredContent,
        commentId,
        postId: post.id,
        userId: user.id
      });
      
      // Update comments list with reply
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          const replies = comment.replies || [];
          return {
            ...comment,
            replies: [...replies, reply]
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      // Increase comment count
      setCommentsCount(prevCount => prevCount + 1);
      
      return reply;
    } catch (error) {
      console.error('Ошибка при ответе на комментарий:', error);
      throw error;
    }
  };
  
  // Delete post
  const handleDeletePost = async () => {
    try {
      setIsDeleting(true);
      
      const result = await postService.deletePost(post.id);
      
      if (result.success) {
        // Call callback to remove post from list
        if (onDelete) {
          onDelete(post.id);
        }
        
        setShowDeleteConfirm(false);
      } else {
        throw new Error('Не удалось удалить пост');
      }
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
      alert('Не удалось удалить пост: ' + (error.message || 'Попробуйте позже.'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Comment deleted handler
  const handleCommentDeleted = (commentId) => {
    // First check if it's a direct comment
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1) {
      // Count replies for this comment
      const repliesCount = comments[commentIndex].replies?.length || 0;
      
      // It's a direct comment, remove it from the list
      setComments(comments.filter(comment => comment.id !== commentId));
      
      // Decrease direct comments count
      setDirectCommentsCount(prevCount => prevCount - 1);
      
      // Decrease total comments count including replies
      setCommentsCount(prevCount => prevCount - (1 + repliesCount));
    } else {
      // It might be a reply, check all comments for this reply
      const updatedComments = comments.map(comment => {
        // If this comment has the reply we're looking for
        if (comment.replies && comment.replies.some(reply => reply.id === commentId)) {
          // Filter out the deleted reply
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== commentId)
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      // Decrease comment count for a reply
      setCommentsCount(prevCount => prevCount - 1);
    }
  };
  
  // Toggle pin status
  const handleTogglePin = async () => {
    if (!isAdmin) return;
    
    try {
      setIsPinning(true);
      
      if (isPinned) {
        // Unpin post
        const result = await postService.unpinPost(post.id);
        if (result.success) {
          setIsPinned(false);
          
          // Call callback to update post list
          if (onPinChange) {
            onPinChange(post.id, false);
          }
        }
      } else {
        // Pin post
        const result = await postService.pinPost(post.id);
        if (result.success) {
          setIsPinned(true);
          
          // Call callback to update post list
          if (onPinChange) {
            onPinChange(post.id, true, result.previousPinnedId);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса закрепления:', error);
      alert('Не удалось изменить статус закрепления: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsPinning(false);
    }
  };
  
  // Update theme listener
  useEffect(() => {
    const handleThemeChange = () => {
      // Force re-render on theme change
      setTimeAgo(formatRelativeTime(post.created_at, isMobile));
    };
    
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, [post.created_at, isMobile]);
  
  // Edit post
  const handleEditPost = async (updatedPost) => {
    if (!isAdmin) return;
    
    try {
      setIsSubmittingEdit(true);
      
      // Call the update function
      const result = await postService.updatePost(post.id, updatedPost);
      
      if (result && result.success) {
        // Update local post data with the response
        if (onUpdate) {
          onUpdate(result.post);
        }
        
        setIsEditing(false);
      } else {
        throw new Error('Не удалось обновить пост');
      }
    } catch (error) {
      console.error('Ошибка при обновлении поста:', error);
      alert('Не удалось обновить пост: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };
  
  // Toggle edit mode with vote check for polls
  const toggleEditMode = () => {
    if (!isAdmin) return;
    
    // For poll posts, make sure to check vote count before editing
    if (isPollPost) {
      checkPollVotesBeforeEdit();
    } else {
      // For regular posts, just toggle edit mode
      setIsEditing(!isEditing);
    }
  };
  
  // New function to check poll votes before allowing edit
  const checkPollVotesBeforeEdit = async () => {
    try {
      // Show loading state
      setIsSubmittingEdit(true);
      
      // Make a fresh request to Supabase to get the current vote count
      const { results } = await postService.getPollResults(post.id);
      
      // Calculate total votes
      const totalVotes = results.reduce((sum, item) => sum + item.votes, 0);
      
      if (totalVotes >= 1) {
        // Show error modal instead of alert
        setShowPollVotesError(true);
      } else {
        // If no votes, allow editing
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Ошибка при проверке голосов опроса:', error);
      // Show error modal instead of alert
      setShowPollCheckError(true);
    } finally {
      setIsSubmittingEdit(false);
    }
  };
  
  // Image lightbox handlers
  const openLightbox = useCallback((imageUrl, urlIndex = 0) => {
    if (post.image_urls && post.image_urls.length > 0) {
      // If we have multiple images, show the gallery
      setLightboxImage(''); // Clear single image
      setLightboxOpen(true);
      setCurrentImageIndex(urlIndex);
    } else if (post.image_url) {
      // For a single image
      setLightboxImage(post.image_url);
      setLightboxOpen(true);
    }
    // Prevent page scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  }, [post.image_url, post.image_urls]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxImage('');
    setCurrentImageIndex(0);
    // Restore page scrolling
    document.body.style.overflow = '';
  }, []);
  
  const renderPostContent = () => (
    <>
      <div className={styles.postHeader}>
        <Link to={`/profile/${post.user_id}`} className={styles.authorInfo}>
          <OptimizedAvatar src={post.author.avatar} alt={post.author.displayName} className={styles.avatar} />
          <span 
            className={
              post.author.activePerk === 'early_user' 
                ? perkStyles.earlyUserPerk
                : post.author.activePerk === 'sponsor' 
                ? perkStyles.sponsorPerk
                : post.author.activePerk === 'admin' 
                ? perkStyles.adminPerk
                : perkStyles.userPerk
            }
            style={{
              display: 'inline-block',
              margin: 0,
              padding: 0
            }}
          >
            {post.author.displayName}
          </span>
        </Link>
        <div className={styles.postMeta}>
          {isPinned && (
            <PinnedBadge>
              <AiOutlinePushpin /> Закреплено
            </PinnedBadge>
          )}
          <span className={styles.postDate}>
            <FiClock /> {timeAgo}
          </span>
        </div>
      </div>
      
      {/* Post Title */}
      {hasTitle && (
        <h2 
          className={styles.postTitle}
          style={{ 
            color: titleColor, 
            fontFamily: fontFamily 
          }}
        >
          <span className={isTitleDark ? styles.darkTextConversion : ''}>
            {post.title}
          </span>
        </h2>
      )}
      
      {/* Post content with color styling */}
      <div 
        className={styles.postContent} 
        style={{ 
          color: contentColor, 
          fontFamily: fontFamily 
        }}
      >
        <span className={isContentDark ? styles.darkTextConversion : ''}>
          {post.content}
        </span>
      </div>
      
      {/* Display images */}
      {post.image_url && !post.image_urls && (
        <div 
          className={styles.postImage} 
          onClick={() => openLightbox(post.image_url)}
        >
          <OptimizedImage 
            src={post.image_url} 
            alt="Изображение к посту" 
            className={styles.postImage} 
            style={{ display: 'block' }} 
          />
        </div>
      )}
      
      {/* Display multiple images if available */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={styles.imageGalleryContainer}>
          {post.image_urls.map((url, index) => (
            <div key={index} className={styles.imagePreviewItem}>
              <div 
                className={styles.imagePreview} 
                onClick={() => openLightbox(url, index)}
              >
                <OptimizedImage 
                  src={url} 
                  alt={`Изображение ${index + 1}`} 
                  className={styles.postImage}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {post.poll_data && (
        <div className={styles.pollContainer}>
          <PollComponent 
            poll={{
              ...post.poll_data,
              hideQuestion: post.title && post.poll_data.question === post.title
            }}
            postId={post.id}
            onVote={handlePollVote}
            hasVoted={hasVoted}
            votedOption={votedOption}
            results={pollResults}
            isAdmin={isAdmin}
            user={user}
          />
        </div>
      )}
    </>
  );
  
  const renderPostActions = () => (
    <div className={styles.postActions}>
      <div className={styles.actionButtons}>
        <button 
          id={`like-${post.id}`}
          className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
          onClick={handleLikeClick}
        >
          <FiHeart /> <span className={styles.likeCount}>{likesCount}</span>
        </button>
        
        <button 
          className={styles.commentButton}
          onClick={toggleComments}
        >
          <FiMessageSquare /> <span>{commentsCount}</span>
        </button>
        
        {isAuthenticated && isAdmin && (
          <PinButton
            onClick={handleTogglePin}
            disabled={isPinning}
            $isPinned={isPinned}
          >
            <AiOutlinePushpin /> {isPinned ? "Открепить" : "Закрепить"}
          </PinButton>
        )}
      </div>
      
      {isAuthenticated && isAdmin && (
        <div className={styles.adminActions}>
          {/* Show edit button for regular posts always, and for poll posts only if no votes */}
          {(!isPollPost || (isPollPost && !pollHasVotes)) && (
            <button 
              className={styles.editButton}
              onClick={toggleEditMode}
              disabled={isEditing || isSubmittingEdit}
            >
              {isSubmittingEdit ? (
                <>
                  <FiLoader /> Проверка...
                </>
              ) : (
                <>
                  <FiEdit /> Изменить
                </>
              )}
            </button>
          )}
          <button 
            className={styles.deleteButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            disabled={isDeleting}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isDeleting ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
              e.currentTarget.style.color = '#e74c3c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = isDeleting ? 'rgba(0, 0, 0, 0.05)' : 'transparent';
              e.currentTarget.style.color = '';
            }}
          >
            <FiTrash2 style={{verticalAlign: 'middle'}} /> {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      )}
    </div>
  );
  
  const renderComments = () => (
    <AnimatePresence>
      {showComments && (
        <CommentSection
          variants={commentSectionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className={styles.commentsSection}>
            <h4 className={styles.commentsHeading}>
              <FiMessageCircle /> Комментарии ({commentsCount})
            </h4>
            
            {isLoadingComments ? (
              <div className={styles.loadingComments}>
                <FiLoader /> Загрузка комментариев...
              </div>
            ) : (
              <>
                {comments && comments.length > 0 ? (
                  <div className={styles.commentsList}>
                    {comments.map(comment => (
                      <CommentItem 
                        key={comment.id} 
                        comment={comment}
                        onReply={handleReplyToComment}
                        onDelete={handleCommentDeleted}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noComments}>
                    Комментариев пока нет. Будьте первым!
                  </div>
                )}
                
                {isAuthenticated && (
                  <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                    {commentError && (
                      <div className={styles.errorMessage}>
                        <FiAlertCircle /> {commentError}
                      </div>
                    )}
                    
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Напишите комментарий..."
                      disabled={isSubmittingComment}
                    />
                    
                    <button type="submit" disabled={isSubmittingComment}>
                      {isSubmittingComment ? (
                        <>
                          <FiLoader /> Отправка...
                        </>
                      ) : (
                        <>
                          <FiSend /> Отправить
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </CommentSection>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Удаление поста"
          message="Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить."
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={handleDeletePost}
          onClose={() => setShowDeleteConfirm(false)}
          isOpen={showDeleteConfirm}
          isDanger={true}
        />
      )}
      
      {/* Poll votes error dialog */}
      {showPollVotesError && (
        <ConfirmDialog
          title="Редактирование невозможно"
          message="Нельзя редактировать опрос, в котором уже есть голоса."
          confirmText="Понятно"
          onConfirm={() => setShowPollVotesError(false)}
          onClose={() => setShowPollVotesError(false)}
          isOpen={showPollVotesError}
          hideCancel={true}
        />
      )}
      
      {/* Poll check error dialog */}
      {showPollCheckError && (
        <ConfirmDialog
          title="Ошибка проверки"
          message="Не удалось проверить статус опроса. Попробуйте позже."
          confirmText="Понятно"
          onConfirm={() => setShowPollCheckError(false)}
          onClose={() => setShowPollCheckError(false)}
          isOpen={showPollCheckError}
          hideCancel={true}
        />
      )}
      
      {isPinned ? (
        <PinnedPostContainer>
          <div className={`${styles.postItem} ${styles.pinnedPost}`}>
            {isEditing ? (
              isPollPost ? (
                <PollEditForm 
                  post={post}
                  onSave={handleEditPost}
                  onCancel={() => setIsEditing(false)}
                  isSubmitting={isSubmittingEdit}
                />
              ) : (
                <EditPostForm 
                  post={post}
                  onSave={handleEditPost}
                  onCancel={() => setIsEditing(false)}
                  isSubmitting={isSubmittingEdit}
                />
              )
            ) : (
              renderPostContent()
            )}
            
            {!isEditing && renderPostActions()}
            {renderComments()}
            
            {showAuthWarning && (
              <Notification
                type="info"
                message={
                  showAuthWarning === 'like' 
                    ? 'Войдите, чтобы поставить лайк' 
                    : showAuthWarning === 'poll' 
                      ? 'Войдите, чтобы проголосовать' 
                      : 'Войдите, чтобы ответить на комментарий'
                }
                show={!!showAuthWarning}
                onClose={() => setShowAuthWarning('')}
              />
            )}
          </div>
        </PinnedPostContainer>
      ) : (
        <div className={styles.postItem}>
          {isEditing ? (
            isPollPost ? (
              <PollEditForm 
                post={post}
                onSave={handleEditPost}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmittingEdit}
              />
            ) : (
              <EditPostForm 
                post={post}
                onSave={handleEditPost}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmittingEdit}
              />
            )
          ) : (
            renderPostContent()
          )}
          
          {!isEditing && renderPostActions()}
          {renderComments()}
          
          {showAuthWarning && (
            <Notification
              type="info"
              message={
                showAuthWarning === 'like' 
                  ? 'Войдите, чтобы поставить лайк' 
                  : showAuthWarning === 'poll' 
                    ? 'Войдите, чтобы проголосовать' 
                    : 'Войдите, чтобы ответить на комментарий'
              }
              show={!!showAuthWarning}
              onClose={() => setShowAuthWarning('')}
            />
          )}
        </div>
      )}
      
      {/* Enhanced Lightbox for image viewing */}
      {lightboxOpen && (
        post.image_urls && post.image_urls.length > 0 ? (
          <ImageLightbox 
            images={post.image_urls} 
            initialIndex={currentImageIndex}
            onClose={closeLightbox} 
          />
        ) : lightboxImage && (
          <ImageLightbox 
            singleImage={lightboxImage}
            onClose={closeLightbox} 
          />
        )
      )}
    </>
  );
};

export default PostItem; 