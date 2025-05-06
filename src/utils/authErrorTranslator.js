/**
 * Функция для перевода ошибок аутентификации от Supabase на русский язык
 * @param {string} errorMessage - Текст ошибки на английском
 * @returns {string} - Переведенный текст ошибки
 */
const translateAuthError = (errorMessage) => {
  // Если сообщение не строка или пустое, возвращаем общую ошибку
  if (!errorMessage || typeof errorMessage !== 'string') {
    return 'Произошла ошибка при авторизации';
  }

  // Словарь с переводами распространенных ошибок
  const errorTranslations = {
    'Invalid login credentials': 'Неверный email или пароль',
    'Email not confirmed': 'Email не подтвержден',
    'User already registered': 'Пользователь с таким email уже зарегистрирован',
    'Invalid email': 'Неверный формат email',
    'Password should be at least 6 characters': 'Пароль должен содержать не менее 6 символов',
    'Email already in use': 'Email уже используется другим пользователем',
    'Email already confirmed': 'Email уже подтвержден',
    'Invalid email or password': 'Неверный email или пароль',
    'Email is required': 'Email обязателен',
    'Password is required': 'Пароль обязателен',
    'Server error': 'Ошибка сервера',
    'The new password should be different from the previous password': 'Новый пароль должен отличаться от текущего',
    'Invalid refresh token': 'Сессия истекла. Пожалуйста, войдите снова',
    'Database error detecting account': 'Ошибка базы данных при поиске аккаунта',
    'Failed to establish connection': 'Не удалось установить соединение с сервером',
    'Password recovery invalid': 'Неверная ссылка для восстановления пароля',
    'Confirmation token expired or invalid': 'Ссылка для подтверждения истекла или недействительна',
    'Unable to validate email address': 'Невозможно проверить email адрес',
    'Access token is missing': 'Отсутствует токен доступа',
    'Access token has expired': 'Срок действия токена доступа истек',
    'Invalid or expired access token': 'Недействительный или просроченный токен доступа',
    'Signup is disabled': 'Регистрация временно отключена',
    'Signup email invalid': 'Указан некорректный email адрес',
    'duplicate key value violates unique constraint': 'Этот адрес email уже зарегистрирован',
    'You must log in to perform this action': 'Необходимо войти для выполнения этого действия',
    'Password must be at least 6 characters': 'Пароль должен содержать не менее 6 символов',
    'Пользователь с таким именем уже существует': 'Пользователь с таким именем уже существует',
    'Your chosen username is already taken by another user': 'Выбранное вами имя пользователя уже занято',
    'Duplicate key value': 'Указанный email или имя пользователя уже используется',
  };

  // Проверяем, есть ли точное совпадение в словаре
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }

  // Если точного совпадения нет, ищем частичное совпадение
  for (const [englishError, russianError] of Object.entries(errorTranslations)) {
    if (errorMessage.includes(englishError)) {
      return russianError;
    }
  }

  // Возвращаем исходное сообщение, если перевод не найден
  return 'Ошибка авторизации: ' + errorMessage;
};

export default translateAuthError; 