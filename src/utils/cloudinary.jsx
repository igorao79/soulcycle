/**
 * Утилиты для работы с изображениями Cloudinary
 */
import React from 'react';

// Cloudinary настройки
const CLOUDINARY_CLOUD_NAME = 'do9t8preg';
const CLOUDINARY_API_KEY = '417482147356551';

// Предопределенные аватары
export const AVATARS = {
  GUEST: 'guest',
  VIVIAN: 'vivian',
  AKITO: 'akito',
  LONARIUS: 'lonarius',
  FAUST: 'faust',
  // Special avatars for admins
  IGOR: 'igorpic',
  LESYA: 'lesyapic'
};

/**
 * Получает URL аватара из Cloudinary
 * @param {string} avatarName - Имя аватара (из AVATARS или пользовательское)
 * @param {Object} options - Опции трансформации
 * @returns {string} URL аватара
 */
export function getAvatarUrl(avatarName = AVATARS.GUEST, options = {}) {
  // Если аватар не указан, используем гостевой аватар
  const avatar = avatarName || AVATARS.GUEST;
  
  // Определяем, какую версию использовать на основе конкретного аватара
  let version = 'v1746775570'; // По умолчанию
  
  // Используем точные версии для специальных аватаров
  if (avatar === AVATARS.IGOR) {
    version = 'v1746562338';
  } else if (avatar === AVATARS.LESYA) {
    version = 'v1746562383';
  }
  
  // Увеличиваем качество для аватаров и добавляем улучшения изображения
  return getCloudinaryUrl(avatar, { 
    ...options, 
    version,
    quality: 100, 
    dpr: "auto",
    flags: "progressive",
    fetch_format: "auto" 
  });
}

/**
 * Создает оптимизированный URL для изображения в Cloudinary
 * 
 * @param {string} path - Путь к изображению в Cloudinary (без расширения)
 * @param {Object} options - Опции трансформации
 * @param {string} [options.format='auto'] - Формат изображения (auto, webp, avif, png, jpg)
 * @param {number} [options.quality=90] - Качество изображения (1-100)
 * @param {number|string} [options.width] - Ширина изображения
 * @param {number|string} [options.height] - Высота изображения
 * @param {string} [options.version='v1746536649'] - Версия изображения
 * @param {string} [options.dpr] - Device Pixel Ratio (1.0, 2.0, auto)
 * @param {string} [options.flags] - Дополнительные флаги
 * @param {string} [options.fetch_format] - Формат для загрузки
 * @returns {string} URL изображения Cloudinary
 */
export function getCloudinaryUrl(path, options = {}) {
  const {
    format = 'auto',
    quality = 90,
    width,
    height,
    version = 'v1746536649',
    dpr,
    flags,
    fetch_format
  } = options;

  let transformations = [];
  
  // Добавляем трансформации качества
  transformations.push(`q_${quality}`);
  
  // Добавляем DPR если указан
  if (dpr) transformations.push(`dpr_${dpr}`);
  
  // Добавляем флаги если указаны
  if (flags) transformations.push(`fl_${flags}`);
  
  // Добавляем fetch_format если указан
  if (fetch_format) transformations.push(`f_${fetch_format}`);
  
  // Обработка параметров ширины и высоты
  const processSize = (size) => {
    if (!size) return null;
    // Если size - это строка содержащая 'px', удаляем 'px'
    if (typeof size === 'string' && size.includes('px')) {
      return parseInt(size.replace('px', ''), 10);
    }
    return size;
  };
  
  // Добавляем трансформации размера, если указаны
  const processedWidth = processSize(width);
  const processedHeight = processSize(height);
  
  if (processedWidth) transformations.push(`w_${processedWidth}`);
  if (processedHeight) transformations.push(`h_${processedHeight}`);
  
  // Добавляем формат изображения
  if (format !== 'auto' && !fetch_format) {
    transformations.push(`f_${format}`);
  }
  
  // Формируем URL с трансформациями
  const transformationsString = transformations.length > 0 
    ? transformations.join(',') + '/' 
    : '';
  
  // Создаем путь без расширения
  let cleanPath = path;
  // Удаляем расширение файла, если оно есть
  const extensionMatch = path.match(/\.(avif|webp|png|jpg|jpeg|svg)$/i);
  if (extensionMatch) {
    cleanPath = path.substring(0, path.lastIndexOf('.'));
  }
  
  // Удаляем путь к папке images/, так как он не используется в Cloudinary
  // и оставляем только имя файла
  const fileName = cleanPath.includes('/') 
    ? cleanPath.substring(cleanPath.lastIndexOf('/') + 1) 
    : cleanPath;
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationsString}${version}/${fileName}`;
}

/**
 * Компонент для отображения аватара пользователя с Cloudinary
 * 
 * @param {Object} props
 * @param {string} props.avatar - Имя аватара (из AVATARS или пользовательское)
 * @param {string} props.alt - Альтернативный текст
 * @param {string} props.className - CSS класс для изображения
 * @param {Object} props.style - Стили для изображения
 * @param {number} props.size - Размер аватара (ширина и высота)
 * @param {Function} props.onClick - Функция клика
 */
export const Avatar = ({
  avatar = AVATARS.GUEST,
  alt = 'Аватар пользователя',
  className,
  style,
  size = 40,
  onClick,
}) => {
  return (
    <CloudinaryImage
      path={avatar}
      alt={alt}
      className={className}
      style={style}
      width={size}
      height={size}
      loading="eager"
      onClick={onClick}
    />
  );
};

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
 * @param {Function} props.onClick - Функция клика
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
  onClick,
}) => {
  // Базовые опции для изображений
  const baseOptions = { width, height };
  
  // Создаем ключи для кеширования на основе пути и размеров
  const cacheKey = `img_${path}_${width || 'auto'}_${height || 'auto'}`;
  const avifSrc = getCloudinaryUrl(path, { ...baseOptions, format: 'avif' });
  const webpSrc = getCloudinaryUrl(path, { ...baseOptions, format: 'webp' });
  const pngSrc = getCloudinaryUrl(path, { ...baseOptions, format: 'png' });
  
  return (
    <picture>
      {/* AVIF формат - наиболее оптимизированный */}
      <source 
        srcSet={avifSrc}
        type="image/avif" 
        key={`avif_${cacheKey}`}
      />
      {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
      <source 
        srcSet={webpSrc}
        type="image/webp" 
        key={`webp_${cacheKey}`}
      />
      {/* PNG формат - запасной вариант для всех браузеров */}
      <img 
        src={pngSrc}
        alt={alt || "Изображение"} 
        className={className}
        style={style}
        width={width}
        height={height}
        loading={loading}
        crossOrigin="anonymous"
        onLoad={onLoad}
        onClick={onClick}
        key={`png_${cacheKey}`}
        onError={(e) => {
          console.warn('Ошибка загрузки изображения:', e.target.src);
          if (onError) onError(e);
        }}
      />
    </picture>
  );
}; 