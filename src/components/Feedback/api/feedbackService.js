// URL сервера обратной связи
const FEEDBACK_API_URL = 'https://scform.onrender.com/api/feedback';

/**
 * Сервис для работы с API обратной связи
 */
const feedbackService = {
  /**
   * Отправляет данные формы обратной связи на сервер
   * @param {Object} data - Данные формы (сообщение, email, имя пользователя)
   * @param {Array} images - Массив изображений для отправки
   * @returns {Promise} - Promise с результатом запроса
   */
  async sendFeedback(data, images) {
    const { message, email, displayName } = data;
    
    console.log('Отправка данных на сервер:', {
      message,
      email,
      displayName,
      imageCount: images.length
    });
    
    // Создаем FormData для отправки данных и файлов
    const formData = new FormData();
    
    // Добавляем текстовые данные
    formData.append('message', message);
    formData.append('email', email);
    formData.append('displayName', displayName || 'Пользователь');
    
    // Добавляем изображения
    images.forEach(image => {
      formData.append('images', image.file);
    });
    
    // Отправляем данные на сервер
    const response = await fetch(FEEDBACK_API_URL, {
      method: 'POST',
      body: formData,
    });
    
    const responseData = await response.json().catch(() => ({}));
    console.log('Ответ сервера:', { status: response.status, data: responseData });
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Произошла ошибка при отправке');
    }
    
    return responseData;
  }
};

export default feedbackService; 