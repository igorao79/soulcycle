import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiImage, FiPlus, FiX, FiMaximize2, FiMinimize2, FiUpload, FiPaperclip } from 'react-icons/fi';
import styles from '../../Post.module.scss';
import imageService from '../../../../utils/imageService';

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

const ImageUploadField = ({ imageUrls, setImageUrls, isSubmitting, setIsImageUploading }) => {
  const [imagePreviewLoading, setImagePreviewLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  // Состояние для лайтбокса
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  // Состояние для проверки устройства
  const [isDesktop, setIsDesktop] = useState(true);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

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
  
  // Setup clipboard paste and drag-drop event handlers
  useEffect(() => {
    // Setup clipboard paste event handler
    const handlePaste = (e) => {
      if (imageUrls.length >= MAX_IMAGES) return;
      
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            handleFileUpload([blob]);
            e.preventDefault();
            break;
          }
        }
      }
    };

    // Setup drag and drop event handlers
    const dropArea = dropAreaRef.current;
    
    if (dropArea) {
      const highlight = () => dropArea.classList.add(styles.highlight);
      const unhighlight = () => dropArea.classList.remove(styles.highlight);
      
      const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        unhighlight();
        
        if (imageUrls.length >= MAX_IMAGES) {
          setErrors(prev => ({
            ...prev,
            maxImagesReached: `Максимальное количество изображений: ${MAX_IMAGES}`
          }));
          return;
        }
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
          );
          
          if (files.length > 0) {
            handleFileUpload(files);
          }
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
    }
  }, [imageUrls.length]);

  // Update loading states for images
  useEffect(() => {
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
      [index]: 'Ошибка загрузки изображения.'
    }));
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    if (imageUrls.length >= MAX_IMAGES) {
      setErrors(prev => ({
        ...prev,
        maxImagesReached: `Максимальное количество изображений: ${MAX_IMAGES}`
      }));
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length > 0) {
        handleFileUpload(files);
      }
    }
  };
  
  // Upload files to Cloudinary
  const handleFileUpload = async (files) => {
    try {
      setIsUploading(true);
      setIsImageUploading(true); // Set parent's loading state
      
      // Check how many files we can upload without exceeding MAX_IMAGES
      const remainingSlots = MAX_IMAGES - imageUrls.length;
      const filesToUpload = files.slice(0, remainingSlots);
      
      // Upload files to Cloudinary with proper folder name
      const uploadedImages = await imageService.uploadMultipleImages(filesToUpload, {
        folder: 'posts', // Use just 'posts' as the folder name
        compress: true
      });
      
      // Add the uploaded image URLs to the imageUrls array
      const newImageUrls = [...imageUrls, ...uploadedImages.map(img => img.url)];
      setImageUrls(newImageUrls);
      
      // Clear any max images error if we still have space
      if (newImageUrls.length < MAX_IMAGES && errors.maxImagesReached) {
        const newErrors = {...errors};
        delete newErrors.maxImagesReached;
        setErrors(newErrors);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setErrors(prev => ({
        ...prev,
        upload: 'Ошибка при загрузке изображений. Попробуйте еще раз.'
      }));
    } finally {
      setIsUploading(false);
      setIsImageUploading(false); // Reset parent's loading state
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

  return (
    <>
      <div className={styles.uploadContainer}>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current.click()}
          disabled={isSubmitting || isUploading || imageUrls.length >= MAX_IMAGES}
        >
          <FiUpload /> {isUploading ? 'Загрузка...' : 'Загрузить изображение'}
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />
      </div>
        
      <div 
        ref={dropAreaRef}
        className={styles.dropArea}
        style={{ display: isSubmitting || imageUrls.length >= MAX_IMAGES ? 'none' : 'block' }}
      >
        <p className={styles.dropText}>
          <FiPaperclip /> Перетащите изображения сюда или вставьте из буфера (Ctrl+V)
        </p>
      </div>
      
      {errors.maxImagesReached && (
        <div className={styles.errorNote}>
          {errors.maxImagesReached}
        </div>
      )}
      
      {errors.upload && (
        <div className={styles.errorNote}>
          {errors.upload}
        </div>
      )}
      
      
      {imageUrls.length > 0 && (
        <div className={styles.imageGalleryContainer}>
          {imageUrls.map((url, index) => (
            <div key={index} className={styles.imagePreviewItem}>
              <div className={styles.imagePreview}>
                {imagePreviewLoading[index] && <div className={styles.imageLoading}>Загрузка...</div>}
                <img 
                  src={url} 
                  alt={`Изображение ${index + 1}`} 
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  style={{ 
                    display: imagePreviewLoading[index] ? 'none' : 'block', 
                    cursor: isDesktop ? 'pointer' : 'default'
                  }}
                  onClick={() => openLightbox(url)}
                />
                <button 
                  className={styles.removeImageButton}
                  onClick={() => handleRemoveUrl(index)}
                  disabled={isSubmitting}
                >
                  <FiX />
                </button>
              </div>
              {errors[index] && (
                <div className={styles.errorNote}>
                  {errors[index]}
                </div>
              )}
            </div>
          ))}
          <div className={styles.imageNote}>
            <FiImage /> Максимум {MAX_IMAGES} изображений.
          </div>
        </div>
      )}
      
      {/* Лайтбокс для увеличения изображения */}
      {lightboxOpen && lightboxImage && (
        <ImageLightbox 
          imageUrl={lightboxImage} 
          onClose={closeLightbox} 
        />
      )}
    </>
  );
};

export default ImageUploadField; 