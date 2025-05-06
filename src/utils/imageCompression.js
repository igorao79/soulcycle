import imageCompression from 'browser-image-compression';

/**
 * Сжимает изображение перед загрузкой на сервер
 * @param {File} imageFile - Исходный файл изображения
 * @param {Object} options - Параметры сжатия
 * @returns {Promise<File>} Сжатый файл изображения
 */
export async function compressImage(imageFile, options = {}) {
  try {
    console.log('Исходное изображение:', imageFile.type, Math.round(imageFile.size / 1024), 'KB');
    
    // Настройки по умолчанию
    const defaultOptions = {
      maxSizeMB: 0.7,             // Максимальный размер в МБ (по умолчанию 0.7 МБ)
      maxWidthOrHeight: 1200,     // Максимальная ширина/высота
      useWebWorker: true,         // Использовать WebWorker для многопоточности
      initialQuality: 0.85,       // Начальное качество сжатия для JPEG/WEBP
      alwaysKeepResolution: false // Сохранять исходное разрешение
    };
    
    // Объединяем настройки по умолчанию и пользовательские
    const compressOptions = { ...defaultOptions, ...options };
    
    // Проверяем размер файла и тип
    if (imageFile.size <= 150 * 1024) { // если меньше 150KB, не сжимаем
      console.log('Изображение уже оптимизировано, пропускаем сжатие');
      return imageFile;
    }
    
    // Если это GIF, возвращаем исходный файл (сжатие может нарушить анимацию)
    if (imageFile.type === 'image/gif') {
      console.log('GIF анимация, пропускаем сжатие');
      return imageFile;
    }
    
    // Выполняем сжатие
    const compressedFile = await imageCompression(imageFile, compressOptions);
    
    console.log('Сжатое изображение:', compressedFile.type, Math.round(compressedFile.size / 1024), 'KB');
    
    // Создаем новый File с правильным именем и типом
    return new File([compressedFile], imageFile.name, {
      type: compressedFile.type
    });
  } catch (error) {
    console.error('Ошибка при сжатии изображения:', error);
    // В случае ошибки возвращаем исходный файл
    return imageFile;
  }
}

/**
 * Изменяет размер изображения и конвертирует в WEBP (если поддерживается браузером)
 * @param {File} imageFile - Исходный файл изображения
 * @param {Number} maxWidth - Максимальная ширина
 * @param {Number} maxHeight - Максимальная высота
 * @param {Number} quality - Качество (0-1)
 * @returns {Promise<Blob>} Оптимизированный файл изображения
 */
export async function resizeAndOptimizeImage(imageFile, maxWidth = 800, maxHeight = 600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Определяем новые размеры с сохранением пропорций
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
        
        // Создаем canvas для ресайза
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Рисуем изображение на canvas с новыми размерами
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Проверяем поддержку WebP
        const isWebPSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        // Конвертируем в наиболее оптимальный формат
        const format = isWebPSupported ? 'image/webp' : 'image/jpeg';
        
        // Получаем Blob с оптимизированного изображения
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Не удалось преобразовать изображение'));
          }
        }, format, quality);
      };
      
      img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
      
      // Загружаем изображение для обработки
      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Конвертирует изображение в base64 строку
 * @param {File} file - Файл изображения
 * @returns {Promise<string>} - Base64 строка
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Примеры использования:
 * 
 * 1. Простое сжатие изображения:
 * const compressedFile = await compressImage(originalFile);
 * 
 * 2. Сжатие с пользовательскими настройками:
 * const compressedFile = await compressImage(originalFile, {
 *   maxSizeMB: 0.5,
 *   maxWidthOrHeight: 800
 * });
 * 
 * 3. Ресайз и оптимизация:
 * const optimizedBlob = await resizeAndOptimizeImage(originalFile, 1200, 900, 0.8);
 * const optimizedFile = new File([optimizedBlob], originalFile.name, { type: optimizedBlob.type });
 */ 