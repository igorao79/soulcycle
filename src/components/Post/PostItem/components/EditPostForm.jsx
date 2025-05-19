import React, { useState, useEffect, useCallback } from 'react';
import { FiAlertCircle, FiLoader, FiSend, FiX, FiImage, FiPlus, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import styles from '../../Post.module.scss';
import { getOptimizedUrl } from '../utils/helpers';

// Компонент для увеличения изображения
const ImageLightbox = ({ imageUrl, onClose }) => {
  // Обработчик нажатия Escape для закрытия
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContainer}>
        <button className={styles.lightboxCloseButton} onClick={onClose}>
          <FiMinimize2 />
        </button>
        <img 
          src={imageUrl} 
          alt="Увеличенное изображение" 
          className={styles.lightboxImage}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

const EditPostForm = ({ post, onSave, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [currentUrl, setCurrentUrl] = useState('');
  const [imageUrls, setImageUrls] = useState(post.image_urls || (post.image_url ? [post.image_url] : []));
  const [optimizedImageUrls, setOptimizedImageUrls] = useState([]);
  const [imagePreviewLoading, setImagePreviewLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  // Состояние для лайтбокса
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  // Состояние для проверки устройства
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Максимальное количество изображений
  const MAX_IMAGES = 5;
  
  // Проверяем тип устройства при монтировании компонента
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    // Проверяем изначально
    checkIfDesktop();
    
    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', checkIfDesktop);
    
    // Очищаем слушатель при размонтировании
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);
  
  // Update optimized image URLs when image URLs change
  useEffect(() => {
    const newOptimizedUrls = imageUrls.map(url => getOptimizedUrl(url));
    setOptimizedImageUrls(newOptimizedUrls);
    
    // Reset loading states
    const loadingStates = {};
    imageUrls.forEach((_, index) => {
      loadingStates[index] = true;
    });
    setImagePreviewLoading(loadingStates);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      const resetLoadingStates = {};
      imageUrls.forEach((_, index) => {
        resetLoadingStates[index] = false;
      });
      setImagePreviewLoading(resetLoadingStates);
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [imageUrls]);

  // Handle image load events
  const handleImageLoad = (index) => {
    setImagePreviewLoading(prev => ({
      ...prev,
      [index]: false
    }));
  };
  
  const handleImageError = (index) => {
    setImagePreviewLoading(prev => ({
      ...prev,
      [index]: false
    }));
    setErrors(prev => ({
      ...prev,
      [index]: 'Ошибка загрузки изображения. Проверьте URL.'
    }));
  };

  // Add a new image URL
  const handleAddUrl = (e) => {
    e.preventDefault();
    if (currentUrl.trim()) {
      // Проверяем лимит изображений
      if (imageUrls.length >= MAX_IMAGES) {
        setErrors(prev => ({
          ...prev,
          maxImagesReached: `Максимальное количество изображений: ${MAX_IMAGES}`
        }));
        return;
      }
      
      setImageUrls([...imageUrls, currentUrl.trim()]);
      setCurrentUrl('');
      // Очищаем ошибку о максимальном количестве изображений
      if (errors.maxImagesReached) {
        const newErrors = {...errors};
        delete newErrors.maxImagesReached;
        setErrors(newErrors);
      }
    }
  };

  // Remove an image URL
  const handleRemoveUrl = (index) => {
    const newUrls = [...imageUrls];
    newUrls.splice(index, 1);
    setImageUrls(newUrls);
    
    // Also clean up errors and loading states
    const newErrors = {...errors};
    delete newErrors[index];
    // Если удалили изображение, убираем ошибку о максимальном количестве
    if (newErrors.maxImagesReached) {
      delete newErrors.maxImagesReached;
    }
    setErrors(newErrors);
    
    const newLoading = {...imagePreviewLoading};
    delete newLoading[index];
    setImagePreviewLoading(newLoading);
  };
  
  // Открытие изображения в лайтбоксе
  const openLightbox = useCallback((imageUrl) => {
    // Открываем лайтбокс только на десктопе
    if (isDesktop) {
      console.log('Opening lightbox for image:', imageUrl);
      setLightboxImage(imageUrl);
      setLightboxOpen(true);
    }
  }, [isDesktop]);

  // Закрытие лайтбокса
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxImage('');
  }, []);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!content.trim()) {
      setError('Текст поста не может быть пустым');
      return;
    }
    
    const updatedPost = {
      title: title.trim() || null,
      content: content.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : null,
      // For backward compatibility also include single image URL if only one image
      image_url: imageUrls.length === 1 ? imageUrls[0] : null
    };
    
    onSave(updatedPost);
  };
  
  return (
    <div className={styles.editPostFormContainer}>
      <form onSubmit={handleSubmit} className={styles.editPostForm}>
        <input
          type="text"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок (необязательно)"
          disabled={isSubmitting}
        />
        
        <textarea
          className={styles.contentInput}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Текст поста"
          disabled={isSubmitting}
          required
        />
        
        <div className={styles.imageUrlInputContainer}>
          <input
            type="text"
            className={styles.imageUrlInput}
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="URL изображения (необязательно)"
            disabled={isSubmitting || imageUrls.length >= MAX_IMAGES}
          />
          <button 
            className={styles.addImageButton}
            onClick={handleAddUrl}
            disabled={!currentUrl.trim() || isSubmitting || imageUrls.length >= MAX_IMAGES}
          >
            <FiPlus /> Добавить
          </button>
        </div>
        
        {errors.maxImagesReached && (
          <div className={styles.errorNote}>
            {errors.maxImagesReached}
          </div>
        )}
        
        {imageUrls.length > 0 && (
          <div className={styles.imageGalleryContainer}>
            {imageUrls.map((url, index) => (
              <div key={index} className={styles.imagePreviewItem}>
                <div className={styles.imagePreview}>
                  {imagePreviewLoading[index] && <div className={styles.imageLoading}>Загрузка...</div>}
                  <img 
                    src={optimizedImageUrls[index] || url} 
                    alt={`Изображение ${index + 1}`} 
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                    style={{ 
                      display: imagePreviewLoading[index] ? 'none' : 'block', 
                      cursor: isDesktop ? 'pointer' : 'default'
                    }}
                    onClick={() => openLightbox(optimizedImageUrls[index] || url)}
                  />
                  <button 
                    className={styles.removeImageButton}
                    onClick={() => handleRemoveUrl(index)}
                    disabled={isSubmitting}
                  >
                    <FiX />
                  </button>
                  {isDesktop && (
                    <span className={styles.zoomHint}>Нажмите для увеличения</span>
                  )}
                </div>
                {errors[index] && (
                  <div className={styles.errorNote}>
                    {errors[index]}
                  </div>
                )}
              </div>
            ))}
            <div className={styles.imageNote}>
              <FiImage /> Максимум {MAX_IMAGES} изображений. {isDesktop && 'Нажмите на изображение для увеличения.'}
            </div>
          </div>
        )}
        
        {error && (
          <div className={styles.errorMessage}>
            <FiAlertCircle /> {error}
          </div>
        )}
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader className={styles.spinnerIcon} /> Сохранение...
              </>
            ) : (
              <>
                <FiSend /> Сохранить
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Лайтбокс для увеличения изображения */}
      {lightboxOpen && lightboxImage && (
        <ImageLightbox 
          imageUrl={lightboxImage} 
          onClose={closeLightbox} 
        />
      )}
    </div>
  );
};

export default EditPostForm; 