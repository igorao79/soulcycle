import { useReducer } from 'react';

// Типы действий
export const ACTIONS = {
  SET_MESSAGE: 'set_message',
  ADD_IMAGE: 'add_image',
  REMOVE_IMAGE: 'remove_image',
  SET_SENDING: 'set_sending',
  SET_SENT: 'set_sent',
  SET_ERROR: 'set_error',
  RESET_FORM: 'reset_form'
};

// Начальное состояние
const initialState = {
  message: '',
  images: [],
  sending: false,
  feedbackSent: false,
  error: ''
};

// Редьюсер
function feedbackReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_MESSAGE:
      return { ...state, message: action.payload };
    case ACTIONS.ADD_IMAGE:
      if (state.images.length >= 5) {
        return { ...state, error: 'Максимальное количество изображений: 5' };
      }
      return { 
        ...state, 
        images: [...state.images, action.payload],
        error: '' 
      };
    case ACTIONS.REMOVE_IMAGE:
      const newImages = [...state.images];
      URL.revokeObjectURL(newImages[action.payload].url);
      newImages.splice(action.payload, 1);
      return { ...state, images: newImages };
    case ACTIONS.SET_SENDING:
      return { ...state, sending: action.payload, error: '' };
    case ACTIONS.SET_SENT:
      return { ...state, feedbackSent: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.RESET_FORM:
      return { ...initialState };
    default:
      return state;
  }
}

/**
 * Хук для управления состоянием формы обратной связи
 * @returns {Object} Состояние формы, actions и dispatch
 */
export function useFeedbackForm() {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);
  
  // Удобные функции-обертки для часто используемых действий
  const setMessage = (message) => dispatch({ type: ACTIONS.SET_MESSAGE, payload: message });
  const addImage = (imageData) => dispatch({ type: ACTIONS.ADD_IMAGE, payload: imageData });
  const removeImage = (index) => dispatch({ type: ACTIONS.REMOVE_IMAGE, payload: index });
  const setSending = (isSending) => dispatch({ type: ACTIONS.SET_SENDING, payload: isSending });
  const setFeedbackSent = (isSent) => dispatch({ type: ACTIONS.SET_SENT, payload: isSent });
  const setError = (errorMessage) => dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
  const resetForm = () => dispatch({ type: ACTIONS.RESET_FORM });
  
  return {
    state,
    dispatch,
    actions: {
      setMessage,
      addImage,
      removeImage,
      setSending,
      setFeedbackSent,
      setError,
      resetForm
    }
  };
} 