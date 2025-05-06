import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';
import { getCloudinaryUrl } from '../../utils/cloudinary.jsx';
import styles from '../../styles/charblock/Icon.module.scss';

/**
 * Компонент для отображения иконок из Cloudinary
 * 
 * @param {Object} props
 * @param {string} props.icon - Имя иконки (vivian, faust, lonarius, akito)
 * @param {string} props.alt - Альтернативный текст для иконки
 * @param {string} props.className - CSS класс для кнопки
 * @param {Function} props.onClick - Обработчик клика на иконку
 * @param {number} props.index - Индекс иконки (для alt)
 */
const CloudinaryIcon = ({ 
  icon, 
  alt, 
  className,
  onClick,
  index
}) => {
  const { theme } = useContext(ThemeContext);
  
  // Проверяем, является ли имя иконки допустимым
  const validIcons = ['vivian', 'faust', 'lonarius', 'akito'];
  
  if (!validIcons.includes(icon)) {
    console.error(`Неверное имя иконки: ${icon}. Допустимые значения: ${validIcons.join(', ')}`);
    return null;
  }
  
  // Базовые опции для изображений
  const baseOptions = { quality: 85 };
  
  return (
    <div>
      <hr />
      <button className={`${styles.btn} ${className || ''}`} onClick={onClick}>
        <picture className={`${styles.btn__pic} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          {/* AVIF формат - наиболее оптимизированный */}
          <source 
            srcSet={getCloudinaryUrl(`${icon}`, { ...baseOptions, format: 'avif' })} 
            type="image/avif" 
          />
          {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
          <source 
            srcSet={getCloudinaryUrl(`${icon}`, { ...baseOptions, format: 'webp' })} 
            type="image/webp" 
          />
          {/* PNG формат - запасной вариант для всех браузеров */}
          <img 
            src={getCloudinaryUrl(`${icon}`, { ...baseOptions, format: 'png' })} 
            alt={alt || `Иконка ${icon} ${index ? `- ${index}` : ''}`} 
            loading="eager"
            decoding="async"
            onError={(e) => {
              console.warn(`Ошибка загрузки иконки ${icon}:`, e.target.src);
            }}
          />
        </picture>
      </button>
      <hr />
    </div>
  );
};

export default CloudinaryIcon; 