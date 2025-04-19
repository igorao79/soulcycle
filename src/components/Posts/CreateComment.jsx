import React, { useState, useCallback } from 'react';
import { auth } from '../../firebase/config';
import { commentsApi } from '../../services/api';
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
      await commentsApi.createComment(postId, content.trim());
      setContent('');
    } catch (err) {
      setError('Ошибка при создании комментария');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, postId]);

  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
    if (error) setError('');
  }, [error]);

  return (
    <div className="create-comment">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Оставьте ваш комментарий..."
          value={content}
          onChange={handleContentChange}
          disabled={isSubmitting}
        />
        {error && <div className="error-message">{error}</div>}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={isSubmitting ? 'submitting' : ''}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
};

export default CreateComment; 