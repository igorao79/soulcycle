/**
 * Утилиты для работы с изображениями Cloudinary
 */
import React from 'react';

// Cloudinary настройки
const CLOUDINARY_CLOUD_NAME = 'do9t8preg';
const CLOUDINARY_API_KEY = '417482147356551';

/**
 * Создает оптимизированный URL для изображения в Cloudinary
 * 
 * @param {string} path - Путь к изображению в Cloudinary (без расширения)
 * @param {Object} options - Опции трансформации
 * @param {string} [options.format='auto'] - Формат изображения (auto, webp, avif, png, jpg)
 * @param {number} [options.quality=85] - Качество изображения (1-100)
 * @param {number} [options.width] - Ширина изображения
 * @param {number} [options.height] - Высота изображения
 * @returns {string} URL изображения Cloudinary
 */
export function getCloudinaryUrl(path, options = {}) {
  const {
    format = 'auto',
    quality = 85,
    width,
    height,
  } = options;

  let transformations = [];
  
  // Добавляем трансформации качества
  transformations.push(`q_${quality}`);
  
  // Добавляем трансформации размера, если указаны
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  
  // Добавляем формат изображения
  if (format !== 'auto') {
    transformations.push(`f_${format}`);
  }
  
  // Формируем URL с трансформациями
  const transformationsString = transformations.length > 0 
    ? transformations.join(',') + '/' 
    : '';
  
  // Создаем путь без расширения
  let cleanPath = path;
  // Удаляем расширение файла, если оно есть
  const extensionMatch = path.match(/\.(avif|webp|png|jpg|jpeg)$/i);
  if (extensionMatch) {
    cleanPath = path.substring(0, path.lastIndexOf('.'));
  }
  
  // Версия изображения в Cloudinary
  const version = 'v1746536649';
  
  // Удаляем путь к папке images/, так как он не используется в Cloudinary
  // и оставляем только имя файла
  const fileName = cleanPath.includes('/') 
    ? cleanPath.substring(cleanPath.lastIndexOf('/') + 1) 
    : cleanPath;
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationsString}${version}/${fileName}`;
}

/**
 * Компонент для отображения оптимизированного изображения с Cloudinary
 * с поддержкой форматов AVIF, WebP и PNG
 * 
 * @param {Object} props
 * @param {string} props.path - Путь к изображению в Cloudinary (без расширения)
 * @param {string} props.alt - Альтернативный текст
 * @param {string} props.className - CSS класс для изображения
 * @param {Object} props.style - Стили для изображения
 * @param {number} props.width - Ширина изображения
 * @param {number} props.height - Высота изображения
 * @param {string} props.loading - Стратегия загрузки (lazy, eager)
 * @param {Function} props.onLoad - Функция, вызываемая при загрузке изображения
 * @param {Function} props.onError - Функция, вызываемая при ошибке загрузки
 */
export const CloudinaryImage = ({
  path,
  alt,
  className,
  style,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  // Базовые опции для изображений
  const baseOptions = { width, height };
  
  return (
    <picture>
      {/* AVIF формат - наиболее оптимизированный */}
      <source 
        srcSet={getCloudinaryUrl(path, { ...baseOptions, format: 'avif' })} 
        type="image/avif" 
      />
      {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
      <source 
        srcSet={getCloudinaryUrl(path, { ...baseOptions, format: 'webp' })} 
        type="image/webp" 
      />
      {/* PNG формат - запасной вариант для всех браузеров */}
      <img 
        src={getCloudinaryUrl(path, { ...baseOptions, format: 'png' })} 
        alt={alt || "Изображение"} 
        className={className}
        style={style}
        width={width}
        height={height}
        loading={loading}
        onLoad={onLoad}
        onError={(e) => {
          console.warn('Ошибка загрузки изображения:', e.target.src);
          if (onError) onError(e);
        }}
      />
    </picture>
  );
}; 