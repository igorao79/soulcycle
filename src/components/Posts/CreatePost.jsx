import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import useUserRole from '../../hooks/useUserRole';
import './Posts.css';
import { FaChevronDown, FaChevronUp, FaPalette, FaFont, FaPoll, FaImage, FaCheck, FaTimes } from 'react-icons/fa';

const CreatePost = () => {
  const { currentUser } = useAuth();
  const { isAdmin } = useUserRole(currentUser?.uid);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [titleColor, setTitleColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatePostPanelCollapsed, setIsCreatePostPanelCollapsed] = useState(false);

  const fonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Source Sans Pro',
    'Oswald',
    'Raleway',
    'Ubuntu',
    'Playfair Display',
    'Merriweather',
    'PT Sans',
    'PT Serif',
    'Noto Sans',
    'Noto Serif'
  ];

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAddPollOption = () => {
    if (pollOptions.some(option => option.trim() === '')) {
      setError('Пожалуйста, заполните все существующие варианты ответа');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length <= 2) {
      return;
    }
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!title.trim()) {
        throw new Error('Пожалуйста, введите заголовок');
      }

      if (!isPoll && !content.trim()) {
        throw new Error('Пожалуйста, введите содержание поста');
      }

      if (isPoll) {
        const validOptions = pollOptions.filter(option => option.trim() !== '');
        if (validOptions.length < 2) {
          throw new Error('Добавьте как минимум два варианта ответа');
        }
        if (new Set(validOptions).size !== validOptions.length) {
          throw new Error('Варианты ответа не должны повторяться');
        }
      }

      const postData = {
        title,
        content: isPoll ? '' : content,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhotoURL: currentUser.photoURL,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        style: {
          titleColor,
          textColor,
          fontFamily
        },
        isPoll: isPoll,
        poll: isPoll ? {
          options: pollOptions.filter(option => option.trim() !== ''),
          votes: {},
          results: {}
        } : null
      };

      await addDoc(collection(db, 'posts'), postData);

      setTitle('');
      setContent('');
      setIsPoll(false);
      setPollOptions(['', '']);
      setTitleColor('#000000');
      setTextColor('#000000');
      setFontFamily('Arial');
      setSuccess('Пост успешно создан!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCreatePostPanel = () => {
    setIsCreatePostPanelCollapsed(!isCreatePostPanelCollapsed);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`create-post ${isCreatePostPanelCollapsed ? 'collapsed' : ''}`}>
      <button 
        type="button" 
        className="create-post-toggle"
        onClick={toggleCreatePostPanel}
      >
        {isCreatePostPanelCollapsed ? <FaChevronDown /> : <FaChevronUp />}
        {isCreatePostPanelCollapsed ? 'Показать панель создания постов' : 'Скрыть панель создания постов'}
      </button>

      {!isCreatePostPanelCollapsed && (
        <>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Заголовок</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок поста"
                required
              />
            </div>

            {!isPoll && (
              <div className="form-group">
                <label htmlFor="content">Содержание поста</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Введите содержание поста..."
                  required
                />
              </div>
            )}

            <div className="poll-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isPoll}
                  onChange={(e) => {
                    setIsPoll(e.target.checked);
                    if (e.target.checked) {
                      setContent(''); // Очищаем содержание при включении опроса
                    }
                  }}
                />
                <FaPoll className="poll-icon" /> Создать как опрос
              </label>
            </div>

            {isPoll && (
              <div className="form-group">
                <label>Варианты ответа</label>
                {pollOptions.map((option, index) => (
                  <div key={index} className="poll-option-input">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handlePollOptionChange(index, e.target.value)}
                      placeholder={`Вариант ${index + 1}`}
                      required
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(index)}
                        className="remove-option"
                        title="Удалить вариант"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-option"
                  onClick={handleAddPollOption}
                >
                  <FaPoll /> Добавить вариант
                </button>
              </div>
            )}

            <div className="style-options">
              <div className="color-picker-container">
                <label className="color-picker-label">
                  <FaPalette /> Цвет заголовка
                </label>
                <input
                  type="color"
                  value={titleColor}
                  onChange={(e) => setTitleColor(e.target.value)}
                  className="color-picker"
                />
              </div>
              <div className="color-picker-container">
                <label className="color-picker-label">
                  <FaPalette /> Цвет текста
                </label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="color-picker"
                />
              </div>
              <div className="font-selector">
                <label>
                  <FaFont /> Шрифт
                </label>
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  {fonts.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="preview-section">
              <h3>Предварительный просмотр</h3>
              <div className="post-preview" style={{ fontFamily }}>
                <h2 className="post-title" style={{ color: titleColor }}>{title || 'Заголовок поста'}</h2>
                {!isPoll && (
                  <div className="post-content" style={{ color: textColor }}>
                    {content || 'Содержание поста'}
                  </div>
                )}
                {isPoll && (
                  <div className="poll-preview">
                    <div className="poll-options">
                      {pollOptions.map((option, index) => (
                        <div 
                          key={index} 
                          className="poll-option" 
                          style={{ 
                            color: textColor,
                            fontFamily: fontFamily
                          }}
                        >
                          <div className="poll-option-content">
                            <div className="poll-option-text">{option || `Вариант ${index + 1}`}</div>
                            <div className="poll-option-result">
                              <div className="poll-option-bar" style={{ width: '0%' }} />
                              <div className="poll-option-stats">
                                <span>0 голосов</span>
                                <span>0%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="poll-total">Всего голосов: 0</div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Создание...' : 'Создать пост'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default CreatePost; 