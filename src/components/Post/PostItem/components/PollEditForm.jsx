import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiLoader, FiSend, FiX, FiPlus, FiType, FiHelpCircle } from 'react-icons/fi';
import styles from '../../Post.module.scss';

const PollEditForm = ({ post, onSave, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [question, setQuestion] = useState(post.poll_data?.question || '');
  const [options, setOptions] = useState(post.poll_data?.options || ['', '']);
  const [error, setError] = useState('');
  
  // Use the title as question if no separate question is provided
  useEffect(() => {
    if (question === '' && title !== '') {
      setQuestion(title);
    }
  }, [title, question]);
  
  // Handle adding a new poll option
  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };
  
  // Handle removing a poll option
  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };
  
  // Handle option text change
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!title.trim() && !question.trim()) {
      setError('Заголовок или вопрос опроса не может быть пустым');
      return;
    }
    
    // Validate options: need at least 2 non-empty options
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Требуется минимум два варианта ответа для опроса');
      return;
    }
    
    // Create updated poll data
    const pollData = {
      question: question.trim() || title.trim(),
      options: options.filter(opt => opt.trim() !== '')
    };
    
    // Create the updated post object
    const updatedPost = {
      title: title.trim(),
      content: content || '', // Ensure content is always defined
      poll: pollData
    };
    
    onSave(updatedPost);
  };
  
  return (
    <div className={styles.editPostForm}>
      {error && (
        <div className={styles.errorMessage}>
          <FiAlertCircle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок опроса"
          disabled={isSubmitting}
          required
        />
        
        <textarea
          className={styles.contentInput}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Дополнительное описание (необязательно)"
          disabled={isSubmitting}
        />
        
        <div className={styles.pollContainer}>
          <div className={styles.inputWithIcon}>
            <FiHelpCircle />
            <input
              type="text"
              className={styles.pollQuestionInput}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Вопрос опроса (если отличается от заголовка)"
              disabled={isSubmitting}
            />
          </div>
          
          <div className={styles.pollOptions}>
            <div className={styles.sectionLabel}>
              <FiType /> Варианты ответа:
            </div>
            
            {options.map((option, index) => (
              <div key={index} className={styles.pollOptionInputWrapper}>
                <input
                  type="text"
                  className={styles.pollOptionInput}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Вариант ${index + 1}`}
                  disabled={isSubmitting}
                  required={index < 2}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className={styles.removeOptionButton}
                    onClick={() => handleRemoveOption(index)}
                    disabled={isSubmitting}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {options.length < 10 && (
            <button
              type="button"
              className={styles.addOptionButton}
              onClick={handleAddOption}
              disabled={isSubmitting}
            >
              <FiPlus /> Добавить вариант
            </button>
          )}
        </div>
        
        <div className={styles.formOptions}>
          <button 
            type="button" 
            className={styles.cancelEditButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <FiX /> Отмена
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader /> Сохранение...
              </>
            ) : (
              <>
                <FiSend /> Сохранить
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PollEditForm; 