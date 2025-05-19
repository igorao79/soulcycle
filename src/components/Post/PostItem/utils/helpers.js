// Cloudinary URL for image optimization with advanced parameters
export const CLOUDINARY_URL = 'https://res.cloudinary.com/do9t8preg/image/fetch/f_auto,q_auto:best,dpr_auto,w_auto,c_limit,w_800/';

// Global cache for optimized URLs to prevent duplicate transformations
export const optimizedUrlCache = new Map();

// Function to get optimized URL with caching
export const getOptimizedUrl = (originalUrl) => {
  if (!originalUrl || typeof originalUrl !== 'string') {
    return null;
  }
  
  // Return cached URL if available
  if (optimizedUrlCache.has(originalUrl)) {
    return optimizedUrlCache.get(originalUrl);
  }
  
  // Skip URLs that are already optimized
  if (originalUrl.includes('res.cloudinary.com/do9t8preg/image/fetch')) {
    optimizedUrlCache.set(originalUrl, originalUrl);
    return originalUrl;
  }
  
  // Skip data URLs
  if (originalUrl.startsWith('data:image/')) {
    optimizedUrlCache.set(originalUrl, originalUrl);
    return originalUrl;
  }
  
  try {
    // Generate optimized URL
    const optimizedUrl = `${CLOUDINARY_URL}${encodeURIComponent(originalUrl)}`;
    optimizedUrlCache.set(originalUrl, optimizedUrl);
    return optimizedUrl;
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return originalUrl;
  }
};

// Функция для форматирования даты
export const formatRelativeTime = (dateString, isMobile = false) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Вычисляем разницу во времени
  const seconds = diffInSeconds;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // Возвращаем отформатированную строку в зависимости от устройства
  if (seconds < 60) {
    return 'только что';
  } else if (minutes < 60) {
    // Для мобильных используем короткий формат
    return isMobile 
      ? `${minutes}м` 
      : `${minutes} ${declOfNum(minutes, ['минуту', 'минуты', 'минут'])} назад`;
  } else if (hours < 24) {
    return isMobile 
      ? `${hours}ч` 
      : `${hours} ${declOfNum(hours, ['час', 'часа', 'часов'])} назад`;
  } else if (days < 7) {
    return isMobile 
      ? `${days}д` 
      : `${days} ${declOfNum(days, ['день', 'дня', 'дней'])} назад`;
  } else if (weeks < 4) {
    return isMobile 
      ? `${weeks}нед` 
      : `${weeks} ${declOfNum(weeks, ['неделю', 'недели', 'недель'])} назад`;
  } else if (months < 12) {
    return isMobile 
      ? `${months}мес` 
      : `${months} ${declOfNum(months, ['месяц', 'месяца', 'месяцев'])} назад`;
  } else {
    return isMobile 
      ? `${years}г` 
      : `${years} ${declOfNum(years, ['год', 'года', 'лет'])} назад`;
  }
};

// Функция для склонения существительных
export const declOfNum = (number, titles) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    number % 100 > 4 && number % 100 < 20 
      ? 2 
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
};

// Helper function to determine if a color is dark/black
export const isDarkColor = (hexColor) => {
  // Handle null or undefined
  if (!hexColor) return false;
  
  // Convert hex to RGB
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance - dark colors have low luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is dark (luminance < 0.5)
  return luminance < 0.5;
}; 