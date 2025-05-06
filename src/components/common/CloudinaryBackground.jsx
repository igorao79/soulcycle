import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';
import { getCloudinaryUrl } from '../../utils/cloudinary.jsx';

/**
 * Компонент для отображения фоновых изображений из Cloudinary
 * с поддержкой темной и светлой темы
 * 
 * @param {Object} props
 * @param {string} props.src - Путь к изображению в Cloudinary (без -black суффикса и расширения)
 * @param {string} props.alt - Альтернативный текст для изображения
 * @param {string} props.className - CSS класс для контейнера
 * @param {Object} props.style - Стили для контейнера
 * @param {Object} props.imgStyle - Стили для изображения
 * @param {Function} props.onLoad - Функция, вызываемая при загрузке изображения
 */
const CloudinaryBackground = ({ 
  src, 
  alt, 
  className, 
  style, 
  imgStyle,
  onLoad 
}) => {
  const { theme } = useContext(ThemeContext);
  
  // Определяем путь к изображению в зависимости от темы
  const imagePath = theme === 'dark' 
    ? 'backgroundblack' // Для темной темы
    : 'background'; // Для светлой темы
  
  // Базовые опции для изображений
  const baseOptions = { quality: 85 };
  
  return (
    <div className={className} style={style}>
      <picture>
        {/* AVIF формат - наиболее оптимизированный */}
        <source 
          srcSet={getCloudinaryUrl(imagePath, { ...baseOptions, format: 'avif' })} 
          type="image/avif" 
        />
        {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
        <source 
          srcSet={getCloudinaryUrl(imagePath, { ...baseOptions, format: 'webp' })} 
          type="image/webp" 
        />
        {/* PNG/JPG формат - запасной вариант для всех браузеров */}
        <img 
          src={getCloudinaryUrl(imagePath, { ...baseOptions, format: 'png' })} 
          alt={alt || "Фоновое изображение"} 
          style={imgStyle}
          loading="eager" // Фоновые изображения должны загружаться сразу
          onLoad={onLoad}
          onError={(e) => {
            console.warn('Ошибка загрузки фонового изображения:', e.target.src);
          }}
        />
      </picture>
    </div>
  );
};

export default CloudinaryBackground; 