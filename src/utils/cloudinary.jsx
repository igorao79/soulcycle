/**
 * Утилиты для работы с изображениями Cloudinary
 */
import React, { useState } from 'react';

// Cloudinary настройки
const CLOUDINARY_CLOUD_NAME = 'do9t8preg';
const CLOUDINARY_API_KEY = '417482147356551';

// Глобальный кэш изображений
const imageCache = new Set();

// Функции для работы с кэшем
export const addToCache = (key) => {
  imageCache.add(key);
};

export const isInCache = (key) => {
  return imageCache.has(key);
};

// Кэш для загруженных изображений в браузере
const browserImageCache = new Map();

// Функция для проверки загрузки изображения в браузере
const isImageLoadedInBrowser = (src) => {
  if (browserImageCache.has(src)) {
    return browserImageCache.get(src);
  }
  
  // Создаем новое изображение для проверки
  const img = new Image();
  img.src = src;
  
  // Если изображение уже загружено (из кеша браузера)
  const isLoaded = img.complete && img.naturalHeight !== 0;
  browserImageCache.set(src, isLoaded);
  
  return isLoaded;
};

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
 * @param {string} [options.folder] - Папка для сохранения изображения (например, 'posts', 'avatars')
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
    fetch_format,
    folder
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
  
  // Строим финальный путь с учетом папки
  let finalPath = cleanPath;
  
  // Если указана папка, добавляем её в путь
  if (folder) {
    const fileName = cleanPath.includes('/') 
      ? cleanPath.substring(cleanPath.lastIndexOf('/') + 1) 
      : cleanPath;
    finalPath = `${folder}/${fileName}`;
  }
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationsString}${version}/${finalPath}`;
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Определяем, какую версию использовать на основе конкретного аватара
  let version = 'v1746775570'; // По умолчанию
  
  // Используем точные версии для специальных аватаров
  if (avatar === AVATARS.IGOR) {
    version = 'v1746562338';
  } else if (avatar === AVATARS.LESYA) {
    version = 'v1746562383';
  }
  
  // Базовые опции для аватаров - НЕ увеличиваем размер в 2 раза!
  const baseOptions = { 
    width: size, // Используем оригинальный размер
    height: size,
    version,
    quality: 85, // Уменьшаем качество для оптимизации
    dpr: "auto",
    flags: "progressive",
    fetch_format: "auto" 
  };

  const avifSrc = getCloudinaryUrl(avatar, { ...baseOptions, format: 'avif' });
  const webpSrc = getCloudinaryUrl(avatar, { ...baseOptions, format: 'webp' });
  const pngSrc = getCloudinaryUrl(avatar, { ...baseOptions, format: 'png' });

  // Проверяем глобальный кеш загруженных изображений при монтировании
  React.useEffect(() => {
    // Проверяем только глобальный кеш, без дополнительных запросов
    if (isInCache(pngSrc)) {
      console.log('Аватар найден в глобальном кеше:', avatar);
      setIsLoading(false);
      setImageLoaded(true);
      setHasError(false);
    }
    // Если не в кеше, изображение загрузится через picture элемент
  }, [avatar, pngSrc]);

  const handleLoad = () => {
    console.log('Аватар успешно загружен:', avatar);
    addToCache(pngSrc); // Добавляем в глобальный кеш
    setIsLoading(false);
    setHasError(false);
    setImageLoaded(true);
  };

  const handleError = (e) => {
    console.warn('Ошибка загрузки аватара:', e.target.src);
    setIsLoading(false);
    setHasError(true);
    setImageLoaded(false);
  };

  return (
    <picture>
      {/* AVIF формат - наиболее оптимизированный */}
      <source srcSet={avifSrc} type="image/avif" />
      {/* WebP формат - хорошо поддерживается в большинстве браузеров */}
      <source srcSet={webpSrc} type="image/webp" />
      {/* PNG формат - запасной вариант для всех браузеров */}
      <img 
        src={pngSrc}
        alt={alt} 
        className={className}
        style={style}
        width={size}
        height={size}
        loading="eager"
        crossOrigin="anonymous"
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
      />
    </picture>
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
 * @param {boolean} props.priority - Новый параметр для приоритетных изображений
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
  priority = false
}) => {
  // Создаем уникальный ключ для кеширования
  const cacheKey = `${path}_${width || 'auto'}_${height || 'auto'}`;
  
  // Базовые опции для изображений
  const baseOptions = { 
    width, 
    height, 
    quality: priority ? 95 : 85,
    dpr: "auto",
    flags: "progressive"
  };

  // Получаем URL изображения
  const imageUrl = getCloudinaryUrl(path, { ...baseOptions, format: 'png' });
  
  // Проверяем, загружено ли изображение
  const isImageCached = isInCache(cacheKey);
  const isBrowserCached = isImageLoadedInBrowser(imageUrl);
  const initialLoaded = isImageCached || isBrowserCached;
  
  const [isLoading, setIsLoading] = useState(!initialLoaded);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(initialLoaded);
  const [isVisible, setIsVisible] = useState(priority || loading === 'eager');
  const imgRef = React.useRef(null);

  // Intersection Observer для lazy loading
  React.useEffect(() => {
    if (priority || loading === 'eager' || isVisible || initialLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.1 
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading, isVisible, initialLoaded]);

  const handleLoad = React.useCallback((e) => {
    setIsLoading(false);
    setImageLoaded(true);
    addToCache(cacheKey);
    browserImageCache.set(imageUrl, true);
    
    if (onLoad) {
      onLoad(e);
    }
  }, [cacheKey, imageUrl, onLoad]);

  const handleError = React.useCallback((e) => {
    console.warn(`Ошибка загрузки изображения: ${path}`, e);
    setHasError(true);
    setIsLoading(false);
    browserImageCache.set(imageUrl, false);
    
    if (onError) {
      onError(e);
    }
  }, [path, imageUrl, onError]);

  // Если изображение не видно и не приоритетное, показываем placeholder
  if (!isVisible && !initialLoaded) {
    return (
      <div 
        ref={imgRef}
        className={className}
        style={{
          ...style,
          width: width || 'auto',
          height: height || 'auto',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
    );
  }

  if (hasError) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          width: width || 'auto',
          height: height || 'auto',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px'
        }}
      >
        Ошибка загрузки
      </div>
    );
  }

  return (
    <picture 
      className={className}
      style={style}
      onClick={onClick}
      ref={imgRef}
    >
      <source 
        srcSet={getCloudinaryUrl(path, { ...baseOptions, format: 'avif' })} 
        type="image/avif" 
      />
      <source 
        srcSet={getCloudinaryUrl(path, { ...baseOptions, format: 'webp' })} 
        type="image/webp" 
      />
      <img 
        src={imageUrl}
        alt={alt || `Изображение ${path}`} 
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  );
}; 