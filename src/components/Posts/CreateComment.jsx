import React, { useState, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import './Posts.css';

const CreateComment = ({ postId }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('Вы должны быть авторизованы, чтобы оставить комментарий');
      return;
    }

    if (!content.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const commentData = {
        postId,
        content: content.trim(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Аноним',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'comments'), commentData);

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      setContent('');
    } catch (err) {
      setError('Ошибка при создании комментария');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, postId]);

  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
    if (error) setError('');
  }, [error]);

  return (
    <form className="create-comment" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Напишите комментарий..."
        className="comment-input"
        disabled={isSubmitting}
      />
      {error && <div className="error-message">{error}</div>}
      <button 
        type="submit" 
        className="submit-button"
        disabled={isSubmitting || !content.trim()}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
};

export default CreateComment; 