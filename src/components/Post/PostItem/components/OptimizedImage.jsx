import React, { useState, useEffect, useMemo } from 'react';
import { getOptimizedUrl } from '../utils/helpers';
import styles from '../../Post.module.scss';

const OptimizedImage = ({ src, alt, className, style }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  
  // Get optimized URL once using memoization
  const { displaySrc, originalSrc } = useMemo(() => {
    const optimized = getOptimizedUrl(src);
    return {
      displaySrc: optimized || src,
      originalSrc: src
    };
  }, [src]);
  
  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };
  
  // Handle image loading error
  const handleImageError = () => {
    // If optimized image failed and we haven't tried the original yet
    if (!useFallback && displaySrc !== originalSrc) {
      setUseFallback(true);
    } else {
      // Both optimized and original failed
      setIsLoading(false);
      setError(true);
    }
  };
  
  // Reset loading state on component unmount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return (
    <div className={`${className || ''} ${styles.imageContainer}`} style={style}>
      {isLoading && <div className={styles.imageLoading}>Загрузка изображения...</div>}
      {error && <div className={styles.imageError}>Ошибка загрузки</div>}
      <img 
        src={useFallback ? originalSrc : displaySrc} 
        alt={alt} 
        style={{ 
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          visibility: isLoading ? 'hidden' : 'visible'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default OptimizedImage; 