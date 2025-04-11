import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc, increment, deleteDoc, collection, query, where, getDocs, addDoc, deleteField, onSnapshot, getDoc, arrayUnion, arrayRemove, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import CommentList from './CommentList';
import CreateComment from './CreateComment';
import './Posts.css';
import { Link } from 'react-router-dom';
import HtmlContent from '../common/HtmlContent';
import { FaCrown, FaStar, FaTag, FaUser, FaHeart, FaRegHeart, FaComment, FaTrash } from 'react-icons/fa';
import useUserData from '../../hooks/useUserData';

// Компонент для отображения опроса
const Poll = ({ poll, postId, currentUser, style }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [results, setResults] = useState(poll.results || {});

  useEffect(() => {
    if (currentUser && poll.votes && poll.votes[currentUser.uid]) {
      setHasVoted(true);
      setSelectedOption(poll.votes[currentUser.uid]);
    }
  }, [currentUser, poll]);

  const handleVote = async (option) => {
    if (!currentUser || hasVoted) return;

    const postRef = doc(db, 'posts', postId);
    const voteRef = doc(db, 'posts', postId, 'votes', currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error('Пост не найден');
        }

        const postData = postDoc.data();
        const poll = postData.poll;

        if (!poll || !poll.options.includes(option)) {
          throw new Error('Неверный вариант ответа');
        }

        if (poll.votes && poll.votes[currentUser.uid]) {
          throw new Error('Вы уже проголосовали');
        }

        const newVotes = { ...poll.votes, [currentUser.uid]: option };
        const newResults = { ...poll.results };
        
        if (!newResults[option]) {
          newResults[option] = 0;
        }
        newResults[option]++;

        transaction.update(postRef, {
          'poll.votes': newVotes,
          'poll.results': newResults
        });

        transaction.set(voteRef, {
          option,
          timestamp: serverTimestamp()
        });
      });

      setHasVoted(true);
      setSelectedOption(option);
      setResults(prev => ({
        ...prev,
        [option]: (prev[option] || 0) + 1
      }));
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      alert(error.message);
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

  useEffect(() => {
    const loadUserData = async () => {
      if (post.authorId) {
        try {
          const userDocRef = doc(db, 'users', post.authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          }
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      }
    };

    loadUserData();
    setIsLoading(false);
  }, [post.authorId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setIsAdmin(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUserId),
      (doc) => {
        if (doc.exists()) {
          setIsAdmin(doc.data().isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      },
      (error) => {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Отслеживаем изменения в количестве комментариев
  useEffect(() => {
    const postRef = doc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setCommentsCount(doc.data().commentsCount || 0);
      }
    });

    return () => unsubscribe();
  }, [post.id]);

  // Отслеживаем изменения в количестве лайков
  useEffect(() => {
    const postRef = doc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setLikesCount(doc.data().likesCount || 0);
      }
    });

    return () => unsubscribe();
  }, [post.id]);

  // Проверяем, лайкнул ли пользователь пост
  useEffect(() => {
    if (!currentUserId || !post.id) return;

    const likesRef = collection(db, 'likes');
    const q = query(
      likesRef,
      where('postId', '==', post.id),
      where('userId', '==', currentUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsLiked(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [currentUserId, post.id]);

  useEffect(() => {
    if (post.isPoll && auth.currentUser) {
      setHasVoted(post.poll?.votes?.[auth.currentUser.uid] !== undefined);
    }
  }, [post.isPoll, post.poll, auth.currentUser]);

  const handleLike = useCallback(async () => {
    if (!auth.currentUser) {
      alert('Вы должны быть авторизованы, чтобы поставить лайк');
      return;
    }

    if (isLikeProcessing) return;
    setIsLikeProcessing(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      const likesRef = collection(db, 'likes');
      
      if (isLiked) {
        // Удаляем лайк
        const q = query(
          likesRef,
          where('postId', '==', post.id),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          await deleteDoc(querySnapshot.docs[0].ref);
        }
        await updateDoc(postRef, {
          likesCount: increment(-1)
        });
      } else {
        // Добавляем лайк
        await addDoc(likesRef, {
          postId: post.id,
          userId: auth.currentUser.uid,
          createdAt: new Date()
        });
        await updateDoc(postRef, {
          likesCount: increment(1)
        });
      }
    } catch (err) {
      console.error('Error updating like:', err);
      alert('Ошибка при обновлении лайка');
    } finally {
      setIsLikeProcessing(false);
    }
  }, [isLiked, post.id, isLikeProcessing]);

  const handleDelete = async () => {
    if (!isAdmin) {
      alert('У вас нет прав для удаления постов');
      return;
    }
    
    if (!window.confirm('Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Удаляем все лайки поста
      const likesRef = collection(db, 'likes');
      const q = query(likesRef, where('postId', '==', post.id));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Удаляем все комментарии поста
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(commentsRef, where('postId', '==', post.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      const deleteCommentsPromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteCommentsPromises);

      // Удаляем сам пост
      await deleteDoc(doc(db, 'posts', post.id));
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Ошибка при удалении поста');
    } finally {
      setIsDeleting(false);
    }
  };

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