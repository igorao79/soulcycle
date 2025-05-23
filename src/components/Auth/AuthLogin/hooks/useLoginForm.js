import { useReducer } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';

// Действия для редьюсера
const ACTIONS = {
  SET_EMAIL: 'set_email',
  SET_PASSWORD: 'set_password',
  SET_ERROR: 'set_error',
  RESET_FORM: 'reset_form'
};

// Начальное состояние
const initialState = {
  email: '',
  password: '',
  error: ''
};

// Функция редьюсера
const loginReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_EMAIL:
      return { ...state, email: action.payload };
    case ACTIONS.SET_PASSWORD:
      return { ...state, password: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.RESET_FORM:
      return initialState;
    default:
      return state;
  }
};

/**
 * Хук для управления состоянием и логикой формы входа
 * @param {Function} onSuccess - Функция, вызываемая при успешном входе
 * @returns {Object} - Состояние формы и методы для работы с ней
 */
export const useLoginForm = (onSuccess) => {
  const { login, loading } = useAuth();
  const [state, dispatch] = useReducer(loginReducer, initialState);
  const { email, password, error } = state;

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Простая валидация
    if (!email || !password) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Пожалуйста, заполните все поля' });
      return;
    }
    
    try {
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' }); // Сбрасываем ошибку перед отправкой
      
      // Вход через контекст
      await login({ email, password });
      
      // После успешного входа вызываем колбэк
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Обработка ошибки аутентификации
      console.error('Ошибка входа:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: err.message || 'Ошибка входа. Проверьте ваши учетные данные.' 
      });
    }
  };

  // Установка email
  const setEmail = (value) => {
    dispatch({ type: ACTIONS.SET_EMAIL, payload: value });
  };

  // Установка пароля
  const setPassword = (value) => {
    dispatch({ type: ACTIONS.SET_PASSWORD, payload: value });
  };

  // Установка ошибки
  const setError = (value) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: value });
  };

  return {
    email,
    password,
    error,
    loading,
    setEmail,
    setPassword,
    setError,
    handleSubmit
  };
}; 