import React from 'react';

// Заглушка для аватара - путь к гостевому аватару
const DEFAULT_AVATAR_PATH = './pics/pfp/guest';

/**
 * Компонент для оптимизированного отображения аватара с поддержкой нескольких форматов
 * 
 * @param {Object} props - Свойства компонента
 * @param {string} props.src - Путь к аватару
 * @param {string} props.alt - Альтернативный текст
 * @param {string} props.className - CSS-класс для элемента img
 * @param {Function} props.onLoad - Обработчик события загрузки
 * @param {Object} props.style - Инлайн стили для элемента img
 * @returns {JSX.Element} - Компонент аватара с поддержкой различных форматов
 */
const OptimizedAvatar = ({ src, alt, className, onLoad, style }) => {
  // Если путь к аватару не указан, используем заглушку
  const basePath = src || DEFAULT_AVATAR_PATH;
  
  // Создаем ссылки на различные форматы изображения
  const getAvatarPath = (format) => {
    // Если путь уже содержит расширение, не изменяем его
    if (src && (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || 
               src.endsWith('.webp') || src.endsWith('.avif') || src.startsWith('data:') ||
               src.startsWith('http'))) {
      return src;
    }
    
    return `${basePath}.${format}`;
  };

  return (
    <picture>
      {/* AVIF формат - наиболее оптимизированный */}
      <source srcSet={getAvatarPath('avif')} type="image/avif" />
      {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
      <source srcSet={getAvatarPath('webp')} type="image/webp" />
      {/* PNG формат - запасной вариант для всех браузеров */}
      <img 
        src={getAvatarPath('png')} 
        alt={alt || "Аватар пользователя"} 
        className={className}
        style={style}
        onLoad={onLoad}
        onError={(e) => {
          console.warn('Ошибка загрузки аватара:', e.target.src);
          // Если все форматы не загрузились, устанавливаем гостевой аватар
          if (e.target.src !== `${DEFAULT_AVATAR_PATH}.png`) {
            e.target.src = `${DEFAULT_AVATAR_PATH}.png`;
          }
          e.target.onerror = null;
        }}
      />
    </picture>
  );
};

export default OptimizedAvatar; 