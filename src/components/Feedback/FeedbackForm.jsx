import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiSend, FiPaperclip, FiX, FiImage } from 'react-icons/fi';
import styles from './FeedbackForm.module.scss';
import { useAuth } from '../../contexts/AuthContext';

// URL сервера обратной связи
const FEEDBACK_API_URL = 'https://scform.onrender.com/api/feedback';

const FeedbackForm = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const dropAreaRef = useRef(null);

  useEffect(() => {
    // Setup clipboard paste event handler
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            addImageFile(blob);
            e.preventDefault();
          }
        }
      }
    };

    // Setup drag and drop event handlers
    const dropArea = dropAreaRef.current;
    
    const highlight = () => dropArea.classList.add(styles.highlight);
    const unhighlight = () => dropArea.classList.remove(styles.highlight);
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      unhighlight();
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('image/')
        );
        
        files.forEach(file => {
          addImageFile(file);
        });
      }
    };
    
    // Add event listeners
    document.addEventListener('paste', handlePaste);
    
    dropArea.addEventListener('dragenter', highlight);
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      highlight();
    });
    dropArea.addEventListener('dragleave', unhighlight);
    dropArea.addEventListener('drop', handleDrop);
    
    // Cleanup
    return () => {
      document.removeEventListener('paste', handlePaste);
      
      dropArea.removeEventListener('dragenter', highlight);
      dropArea.removeEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      dropArea.removeEventListener('dragleave', unhighlight);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  const addImageFile = (file) => {
    if (images.length >= 5) {
      setError('Максимальное количество изображений: 5');
      return;
    }
    
    // Create a URL for preview
    const imageUrl = URL.createObjectURL(file);
    
    setImages(prevImages => [
      ...prevImages, 
      { file, url: imageUrl }
    ]);
    
    setError(''); // Clear any error
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      files.forEach(file => {
        addImageFile(file);
      });
    }
  };

  const removeImage = (index) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.email) {
      setError('Необходимо войти в аккаунт для отправки обратной связи');
      return;
    }
    
    if (!message.trim()) {
      setError('Пожалуйста, введите текст сообщения');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      // Создаем FormData для отправки данных и файлов
      const formData = new FormData();
      
      // Добавляем текстовые данные
      formData.append('message', message);
      formData.append('email', user.email);
      formData.append('displayName', user.displayName || 'Пользователь');
      
      // Добавляем изображения
      images.forEach(image => {
        formData.append('images', image.file);
      });
      
      console.log('Отправка данных на сервер:', {
        message,
        email: user.email,
        displayName: user.displayName,
        imageCount: images.length
      });
      
      // Отправляем данные на сервер
      const response = await fetch(FEEDBACK_API_URL, {
        method: 'POST',
        body: formData,
      });
      
      const responseData = await response.json().catch(() => ({}));
      console.log('Ответ сервера:', { status: response.status, data: responseData });
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Произошла ошибка при отправке');
      }
      
      // Очистка формы после отправки
      setMessage('');
      setImages([]);
      setFeedbackSent(true);
      
      // Сбрасываем статус через 5 секунд
      setTimeout(() => {
        setFeedbackSent(false);
      }, 5000);
      
    } catch (error) {
      console.error('Ошибка отправки обратной связи:', error);
      setError(`Не удалось отправить сообщение: ${error.message}. Пожалуйста, попробуйте позже или свяжитесь напрямую: igoraor79@gmail.com.`);
    } finally {
      setSending(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: 'beforeChildren',
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const buttonVariants = {
    hover: { 
      scale: 1.03,
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)" 
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className={styles.pageContainer}>
      <motion.div 
        className={styles.formContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className={styles.title}
          variants={itemVariants}
        >
          Обратная связь
        </motion.h1>
        
        {error && (
          <motion.div 
            className={styles.errorMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
        
        {feedbackSent && (
          <motion.div 
            className={styles.successMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Ваше сообщение успешно отправлено! Спасибо за обратную связь.
          </motion.div>
        )}
        
        <form ref={formRef} onSubmit={handleSubmit}>
          <motion.div 
            className={styles.formGroup}
            variants={itemVariants}
          >
            <label>
              <FiMail className={styles.inputIcon} /> Email:
            </label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIconInside} />
              <input
                type="email"
                value={user?.email || 'Пожалуйста, войдите в аккаунт'}
                disabled={true}
                readOnly
                className={styles.disabledInput}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className={styles.formGroup}
            variants={itemVariants}
          >
            <label>Суть запроса:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              placeholder="Опишите ваш запрос или предложение детально..."
              rows={6}
              className={styles.textarea}
              required
            />
          </motion.div>
          
          <motion.div 
            className={styles.formGroup}
            variants={itemVariants}
          >
            <label>
              <FiPaperclip className={styles.inputIcon} /> Вложения:
            </label>
            <div 
              ref={dropAreaRef}
              className={styles.dropArea}
            >
              <p>
                Перетащите изображения сюда или <button 
                  type="button" 
                  className={styles.browseButton}
                  onClick={() => fileInputRef.current.click()}
                >выберите файлы</button>
              </p>
              <p className={styles.dropHint}>
                Вы также можете вставить изображения из буфера обмена (Ctrl+V)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*"
                multiple
              />
            </div>
            
            {images.length > 0 && (
              <motion.div 
                className={styles.imagePreviewContainer}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                {images.map((image, index) => (
                  <div key={index} className={styles.imagePreview}>
                    <img src={image.url} alt={`Прикрепленное изображение ${index+1}`} />
                    <button 
                      type="button" 
                      className={styles.removeImageButton}
                      onClick={() => removeImage(index)}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
          
          <motion.button 
            type="submit" 
            className={styles.submitButton}
            disabled={sending || !user?.email}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {sending ? 'Отправка...' : (
              <>
                <FiSend className={styles.buttonIcon} />
                <span>Отправить</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackForm; 