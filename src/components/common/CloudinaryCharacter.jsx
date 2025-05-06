import React from 'react';
import { getCloudinaryUrl } from '../../utils/cloudinary.jsx';

/**
 * Компонент для отображения изображений персонажей из Cloudinary
 * 
 * @param {Object} props
 * @param {string} props.character - Имя персонажа (faust, vivian, lonarius)
 * @param {string} props.alt - Альтернативный текст для изображения
 * @param {string} props.className - CSS класс для изображения
 * @param {Object} props.style - Стили для изображения
 * @param {string} props.loading - Стратегия загрузки (lazy, eager)
 * @param {Function} props.onLoad - Функция, вызываемая при загрузке изображения
 */
const CloudinaryCharacter = ({ 
  character, 
  alt, 
  className, 
  style,
  loading = 'lazy',
  onLoad 
}) => {
  // Проверяем, является ли имя персонажа допустимым
  const validCharacters = ['faust', 'vivian', 'lonarius'];
  
  if (!validCharacters.includes(character)) {
    console.error(`Неверное имя персонажа: ${character}. Допустимые значения: ${validCharacters.join(', ')}`);
    return null;
  }
  
  // Добавляем суффикс full для полного изображения персонажа
  const characterImageName = `${character}full`;
  
  // Базовые опции для изображений
  const baseOptions = { quality: 85 };
  
  return (
    <picture>
      {/* AVIF формат - наиболее оптимизированный */}
      <source 
        srcSet={getCloudinaryUrl(characterImageName, { ...baseOptions, format: 'avif' })} 
        type="image/avif" 
      />
      {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
      <source 
        srcSet={getCloudinaryUrl(characterImageName, { ...baseOptions, format: 'webp' })} 
        type="image/webp" 
      />
      {/* PNG формат - запасной вариант для всех браузеров */}
      <img 
        src={getCloudinaryUrl(characterImageName, { ...baseOptions, format: 'png' })} 
        alt={alt || `Персонаж ${character}`} 
        className={className}
        style={style}
        loading={loading}
        onLoad={onLoad}
        onError={(e) => {
          console.warn(`Ошибка загрузки изображения персонажа ${character}:`, e.target.src);
        }}
      />
    </picture>
  );
};

export default CloudinaryCharacter; 