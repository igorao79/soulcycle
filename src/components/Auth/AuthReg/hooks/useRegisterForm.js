import { useReducer } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';

// Действия для редьюсера
const ACTIONS = {
  SET_EMAIL: 'set_email',
  SET_PASSWORD: 'set_password',
  SET_CONFIRM_PASSWORD: 'set_confirm_password',
  SET_DISPLAY_NAME: 'set_display_name',
  SET_ERROR: 'set_error',
  RESET_FORM: 'reset_form'
};

// Начальное состояние формы
const initialState = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  error: ''
};

// Функция редьюсера
const registerReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_EMAIL:
      return { ...state, email: action.payload };
    case ACTIONS.SET_PASSWORD:
      return { ...state, password: action.payload };
    case ACTIONS.SET_CONFIRM_PASSWORD:
      return { ...state, confirmPassword: action.payload };
    case ACTIONS.SET_DISPLAY_NAME:
      return { ...state, displayName: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.RESET_FORM:
      return initialState;
    default:
      return state;
  }
};

/**
 * Хук для управления состоянием и логикой формы регистрации
 * @param {Function} onSuccess - Функция, вызываемая при успешной регистрации
 * @returns {Object} - Состояние формы и методы для работы с ней
 */
export const useRegisterForm = (onSuccess) => {
  const { register, loading } = useAuth();
  const [state, dispatch] = useReducer(registerReducer, initialState);
  const { email, password, confirmPassword, displayName, error } = state;

  // Валидация формы перед отправкой
  const validateForm = () => {
    if (!email || !password || !confirmPassword || !displayName) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Пожалуйста, заполните все поля' 
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Пароли не совпадают' 
      });
      return false;
    }
    
    if (password.length < 6) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Пароль должен содержать не менее 6 символов' 
      });
      return false;
    }
    
    if (password.length > 15) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Пароль не должен превышать 15 символов' 
      });
      return false;
    }
    
    if (displayName.length > 12) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Имя пользователя не должно превышать 12 символов' 
      });
      return false;
    }
    
    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' }); // Сбрасываем ошибку перед отправкой
      
      // Регистрируем пользователя через контекст
      const response = await register({
        email,
        password,
        displayName
      });
      
      console.log('Регистрация успешна:', response);
      
      // Ждем момент, чтобы сессия Supabase полностью установилась
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // После успешной регистрации вызываем колбэк
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: err.message || 'Ошибка при регистрации. Попробуйте позже.' 
      });
    }
  };

  // Обработчики изменения значений полей с валидацией
  const handleDisplayNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 12) {
      dispatch({ type: ACTIONS.SET_DISPLAY_NAME, payload: value });
    }
  };
  
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (value.length <= 15) {
      dispatch({ type: ACTIONS.SET_PASSWORD, payload: value });
    }
  };
  
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    if (value.length <= 15) {
      dispatch({ type: ACTIONS.SET_CONFIRM_PASSWORD, payload: value });
    }
  };

  const setEmail = (value) => {
    dispatch({ type: ACTIONS.SET_EMAIL, payload: value });
  };

  const setError = (value) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: value });
  };

  return {
    email,
    password,
    confirmPassword,
    displayName,
    error,
    loading,
    setEmail,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleDisplayNameChange,
    handleSubmit,
    setError
  };
}; 