import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';
import { getCloudinaryUrl } from '../../utils/cloudinary.jsx';
import styles from '../../styles/hp/HomePage.module.scss';

/**
 * Компонент для отображения изображений с поддержкой темной/светлой темы
 * с использованием Cloudinary
 * 
 * @param {Object} props
 * @param {string} props.src - Путь к изображению (полный путь или только имя файла)
 * @param {string} props.alt - Альтернативный текст изображения
 * @param {string} props.folder - Папка изображения в Cloudinary (по умолчанию 'logo')
 * @param {number} props.width - Ширина изображения (опционально)
 * @param {number} props.height - Высота изображения (опционально)
 */
const UseContext = ({ src, alt, folder = 'logo', width, height }) => {
  const { theme } = useContext(ThemeContext);

  // Определяем, является ли путь полным или только именем файла
  const isFullPath = src.startsWith('./') || src.startsWith('http');
  
  if (isFullPath) {
    // Для локальных файлов используем стандартный подход с <picture>
    // Извлекаем только имя файла
    let fileName = src.split('/').pop();
    
    // Убираем суффикс -black и расширение из имени файла
    fileName = fileName.replace('-black', '').replace(/\.(avif|webp|png|jpg|jpeg)$/i, '');
    
    // Определяем имя файла в зависимости от темы
    const themeFileName = theme === 'dark' ? `${fileName}-black` : fileName;
    
    // Формируем путь к локальному файлу
    const getImagePath = (format) => {
      return `${src.substring(0, src.lastIndexOf('/') + 1)}${themeFileName}.${format}`;
    };
    
    return (
      <picture className={`${styles.main__header__pic} ${theme === 'dark' ? styles.darkTheme : ''}`}>
        <source srcSet={getImagePath('avif')} type="image/avif" />
        <source srcSet={getImagePath('webp')} type="image/webp" />
        <img
          src={getImagePath('png')}
          alt={alt}
          loading="lazy"
          width={width}
          height={height}
          onError={(e) => {
            console.warn('Ошибка загрузки изображения:', e.target.src);
          }}
        />
      </picture>
    );
  }
  
  // Для Cloudinary - используем чистое имя файла без путей и расширений
  const fileName = src.replace(/\.(avif|webp|png|jpg|jpeg)$/i, '');
  
  // Для логотипа обычно не нужна темная версия, но если нужно, можно добавить
  const imageName = fileName;
  
  // Базовые опции для изображений
  const baseOptions = { 
    quality: 90,
    width: width || (src === 'sclogo' ? 160 : undefined), // По умолчанию логотип 160px
    height
  };
  
  return (
    <picture className={`${styles.main__header__pic} ${theme === 'dark' ? styles.darkTheme : ''}`}>
      {/* AVIF формат - наиболее оптимизированный */}
      <source
        srcSet={getCloudinaryUrl(imageName, { ...baseOptions, format: 'avif' })}
        type="image/avif"
      />
      {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
      <source
        srcSet={getCloudinaryUrl(imageName, { ...baseOptions, format: 'webp' })}
        type="image/webp"
      />
      {/* PNG формат - запасной вариант для всех браузеров */}
      <img
        src={getCloudinaryUrl(imageName, { ...baseOptions, format: 'png' })}
        alt={alt}
        loading="lazy"
        width={width || (src === 'sclogo' ? 160 : undefined)}
        height={height}
        onError={(e) => {
          console.warn('Ошибка загрузки изображения:', e.target.src);
        }}
      />
    </picture>
  );
};

export default UseContext;