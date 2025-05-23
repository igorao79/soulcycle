import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPaperclip, FiX } from 'react-icons/fi';
import { imageVariants, imageContainerVariants } from '../config/animations';
import styles from '../FeedbackForm.module.scss';

/**
 * Компонент для загрузки изображений с поддержкой drag-and-drop
 */
const ImageUploader = ({ images, onAddImage, onRemoveImage }) => {
  const fileInputRef = useRef(null);
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
  }, [onAddImage]);

  const addImageFile = (file) => {
    // Create a URL for preview
    const imageUrl = URL.createObjectURL(file);
    onAddImage({ file, url: imageUrl });
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

  return (
    <div className={styles.formGroup}>
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
      
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div 
            className={styles.imagePreviewContainer}
            variants={imageContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {images.map((image, index) => (
              <motion.div 
                key={index} 
                className={styles.imagePreview}
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <img src={image.url} alt={`Прикрепленное изображение ${index+1}`} />
                <button 
                  type="button" 
                  className={styles.removeImageButton}
                  onClick={() => onRemoveImage(index)}
                >
                  <FiX />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader; 