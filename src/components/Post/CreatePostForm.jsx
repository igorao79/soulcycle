import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/postService';
import styles from './Post.module.scss';
import { 
  FiEdit, FiImage, FiBarChart2, FiPlus, FiMinus, 
  FiSend, FiAlertCircle, FiType, FiDroplet, FiSettings,
  FiFileText, FiLock
} from 'react-icons/fi';
import { AiOutlinePushpin } from 'react-icons/ai';
import { HexColorPicker } from 'react-colorful';
import { Link } from 'react-router-dom';

// Доступные шрифты
const FONT_OPTIONS = [
  { name: 'По умолчанию', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Poppins', value: "'Poppins', sans-serif" },
  { name: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif" },
  { name: 'Ubuntu', value: "'Ubuntu', sans-serif" },
  { name: 'Raleway', value: "'Raleway', sans-serif" },
  { name: 'Nunito', value: "'Nunito', sans-serif" }
];

// Add these CSS changes to make the form more responsive
const formOptionsStyle = `
  .${styles.formOptions} {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }
  
  .${styles.formToggles} {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .${styles.optionToggle} {
    display: flex;
    align-items: center;
    gap: 5px;
    background-color: rgba(0, 0, 0, 0.03);
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
    margin-bottom: 5px;
  }
  
  .${styles.submitButton} {
    margin-top: 5px;
    align-self: flex-end;
  }
  
  @media (max-width: 768px) {
    .${styles.formOptions} {
      width: 100%;
    }
    
    .${styles.formToggles} {
      width: 100%;
      justify-content: flex-start;
    }
    
    .${styles.optionToggle} {
      flex: 0 0 auto;
      font-size: 13px;
    }
    
    .${styles.submitButton} {
      width: 100%;
      margin-top: 10px;
    }
  }
`;

const CreatePostForm = ({ onPostCreated }) => {
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Проверяем права администратора
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // Если пользователь не администратор, не отображаем форму
  if (!isAdmin) {
    return null;
  }
  
  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  // Pin state
  const [isPinned, setIsPinned] = useState(false);
  
  // Styling options
  const [showStylingOptions, setShowStylingOptions] = useState(false);
  const [titleColor, setTitleColor] = useState('#000000');
  const [contentColor, setContentColor] = useState('#000000');
  const [pollOptionsColor, setPollOptionsColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('inherit');
  
  // Состояния для отображения цветовых пикеров
  const [showTitleColorPicker, setShowTitleColorPicker] = useState(false);
  const [showContentColorPicker, setShowContentColorPicker] = useState(false);
  const [showOptionsColorPicker, setShowOptionsColorPicker] = useState(false);
  
  // Handle adding a new poll option
  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };
  
  // Handle removing a poll option
  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };
  
  // Handle poll option change
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  
  // Toggle poll interface
  const togglePoll = () => {
    setShowPoll(!showPoll);
    if (showPoll) {
      // Reset poll data
      setPollOptions(['', '']);
    } else {
      // Start with two empty options
      setPollOptions(['', '']);
    }
  };
  
  // Toggle styling options
  const toggleStylingOptions = () => {
    setShowStylingOptions(!showStylingOptions);
  };
  
  const validatePoll = () => {
    // Check if at least two poll options are filled
    const filledOptions = pollOptions.filter(option => option.trim().length > 0);
    if (filledOptions.length < 2) {
      setError('Для опроса необходимо минимум два варианта ответа');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Повторная проверка прав администратора
    if (!isAdmin) {
      setError('У вас недостаточно прав для создания постов');
      return;
    }
    
    // Требуем текст только если нет опроса
    if (!showPoll && !content.trim()) {
      setError('Текст поста не может быть пустым');
      return;
    }
    
    // Если опрос включен, но оба поля пустые - ошибка
    if (showPoll && !content.trim() && !title.trim()) {
      setError('Добавьте текст поста или заголовок для опроса');
      return;
    }
    
    // Validate poll if it's shown
    if (showPoll && !validatePoll()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Prepare poll data if needed - обеспечиваем правильный формат
      const pollData = showPoll ? {
        question: title.trim() || content.trim().split(' ').slice(0, 5).join(' ') + '...', 
        options: pollOptions.filter(option => option.trim().length > 0).map(option => option.trim()),
        optionsColor: pollOptionsColor,
        styling: {
          optionsColor: pollOptionsColor,
          fontFamily: selectedFont
        }
      } : null;
      
      // Create post data object
      const postData = {
        title: title.trim() || null, 
        content: content.trim(),
        imageUrl: imageUrl || null,
        userId: user.id,
        styling: {
          titleColor: titleColor, 
          contentColor: contentColor,
          fontFamily: selectedFont
        },
        poll: pollData, // Передаем данные опроса
        isPinned: isPinned // Передаем флаг закрепления
      };
      
      // Log post data for debugging
      console.log('Sending post data:', JSON.stringify(postData, null, 2));
      
      const newPost = await postService.createPost(postData);
      
      // Очищаем форму
      setTitle('');
      setContent('');
      setImageUrl('');
      setShowPoll(false);
      setPollOptions(['', '']);
      setShowStylingOptions(false);
      setTitleColor('#000000');
      setContentColor('#000000');
      setPollOptionsColor('#000000');
      setSelectedFont('inherit');
      setIsPinned(false);
      
      // Вызываем обратный вызов для обновления списка постов
      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err) {
      console.error('Ошибка при создании поста:', err);
      
      // Показываем более подробную информацию об ошибке
      if (err.message) {
        setError(`Не удалось создать пост: ${err.message}`);
      } else if (err.details) {
        setError(`Ошибка: ${err.details}`);
      } else {
        setError('Не удалось создать пост. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isDarkColor = (hexColor) => {
    // Handle null or undefined
    if (!hexColor) return false;
    
    // Convert hex to RGB
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance - dark colors have low luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return true if the color is dark (luminance < 0.5)
    return luminance < 0.5;
  };
  
  return (
    <div className={styles.createPostContainer}>
      {/* Inject the responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: formOptionsStyle }} />
      
      <h3 className={styles.createPostTitle}>
        <FiEdit /> Создать пост
      </h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <FiAlertCircle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.createPostForm}>
        <input
          type="text"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок поста"
          disabled={isSubmitting}
          style={{ color: titleColor, fontFamily: selectedFont }}
        />
        
        <textarea
          className={styles.contentInput}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={showPoll ? "Текст поста с опросом (необязательно)..." : "Текст вашего поста..."}
          rows={4}
          disabled={isSubmitting}
          required={!showPoll}
          style={{ color: contentColor, fontFamily: selectedFont }}
        />
        
        {!showPoll && (
          <input
            type="text"
            className={styles.imageUrlInput}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL изображения (необязательно)"
            disabled={isSubmitting}
          />
        )}
        
        {showPoll && (
          <div className={styles.pollContainer}>
            <div className={styles.pollOptions}>
              {pollOptions.map((option, index) => (
                <div key={index} className={styles.pollOption}>
                  <div className={styles.pollOptionInputWrapper}>
                    <input
                      type="text"
                      className={styles.pollOptionInput}
                      value={option}
                      onChange={(e) => handlePollOptionChange(index, e.target.value)}
                      placeholder={`Вариант ${index + 1}`}
                      disabled={isSubmitting}
                      style={{ color: pollOptionsColor, fontFamily: selectedFont }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(index)}
                        className={styles.removeOptionButton}
                        disabled={isSubmitting}
                      >
                        <FiMinus />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={handleAddPollOption}
              className={styles.addOptionButton}
              disabled={isSubmitting || pollOptions.length >= 6}
            >
              <FiPlus /> Добавить вариант
            </button>
          </div>
        )}
        
        {showStylingOptions && (
          <div className={styles.stylingOptions}>
            <h4 className={styles.stylingTitle}>
              <FiDroplet /> Настройки стиля
            </h4>
            
            <div className={styles.stylingGroup}>
              <label>Шрифт:</label>
              <select 
                value={selectedFont} 
                onChange={(e) => setSelectedFont(e.target.value)}
                className={styles.fontSelector}
                disabled={isSubmitting}
                style={{ fontFamily: selectedFont }}
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.stylingGroup}>
              <label>Цвет заголовка:</label>
              <div className={styles.colorPickerContainer}>
                <div 
                  className={styles.colorPreview}
                  style={{ backgroundColor: titleColor }}
                  onClick={() => setShowTitleColorPicker(!showTitleColorPicker)}
                >
                  <FiDroplet className={styles.dropletIcon} />
                </div>
                {showTitleColorPicker && (
                  <div className={styles.colorPickerPopup}>
                    <div 
                      className={styles.colorPickerCover} 
                      onClick={() => setShowTitleColorPicker(false)}
                    />
                    <HexColorPicker 
                      color={titleColor} 
                      onChange={setTitleColor} 
                    />
                  </div>
                )}
              </div>
              {isDarkColor(titleColor) && (
                <div className={styles.colorNote}>
                  Примечание: тёмные цвета будут автоматически адаптированы в темной теме для лучшей читаемости.
                </div>
              )}
            </div>
            
            <div className={styles.stylingGroup}>
              <label>Цвет текста поста:</label>
              <div className={styles.colorPickerContainer}>
                <div 
                  className={styles.colorPreview}
                  style={{ backgroundColor: contentColor }}
                  onClick={() => setShowContentColorPicker(!showContentColorPicker)}
                >
                  <FiDroplet className={styles.dropletIcon} />
                </div>
                {showContentColorPicker && (
                  <div className={styles.colorPickerPopup}>
                    <div 
                      className={styles.colorPickerCover} 
                      onClick={() => setShowContentColorPicker(false)}
                    />
                    <HexColorPicker 
                      color={contentColor} 
                      onChange={setContentColor} 
                    />
                  </div>
                )}
              </div>
              {isDarkColor(contentColor) && (
                <div className={styles.colorNote}>
                  Примечание: тёмные цвета будут автоматически адаптированы в темной теме для лучшей читаемости.
                </div>
              )}
            </div>
            
            {showPoll && (
              <div className={styles.stylingGroup}>
                <label>Цвет вариантов опроса:</label>
                <div className={styles.colorPickerContainer}>
                  <div 
                    className={styles.colorPreview}
                    style={{ backgroundColor: pollOptionsColor }}
                    onClick={() => setShowOptionsColorPicker(!showOptionsColorPicker)}
                  >
                    <FiDroplet className={styles.dropletIcon} />
                  </div>
                  {showOptionsColorPicker && (
                    <div className={styles.colorPickerPopup}>
                      <div 
                        className={styles.colorPickerCover} 
                        onClick={() => setShowOptionsColorPicker(false)}
                      />
                      <HexColorPicker 
                        color={pollOptionsColor} 
                        onChange={setPollOptionsColor} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.formOptions}>
          <div className={styles.formToggles}>
            <label className={styles.optionToggle}>
              <input
                type="checkbox"
                checked={showPoll}
                onChange={togglePoll}
                disabled={isSubmitting}
              />
              <FiBarChart2 /> {showPoll ? "Убрать опрос" : "Добавить опрос"}
            </label>
            
            <label className={styles.optionToggle}>
              <input
                type="checkbox"
                checked={showStylingOptions}
                onChange={toggleStylingOptions}
                disabled={isSubmitting}
              />
              <FiSettings /> {showStylingOptions ? "Скрыть настройки" : "Настройки стиля"}
            </label>
            
            <label className={styles.optionToggle}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={() => setIsPinned(!isPinned)}
                disabled={isSubmitting}
              />
              <AiOutlinePushpin /> {isPinned ? "Открепить" : "Закрепить"}
            </label>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Публикация...' : <><FiSend /> Опубликовать</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm; 