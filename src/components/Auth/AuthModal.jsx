import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiX } from 'react-icons/fi';
import styles from './AuthModal.module.scss';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = React.useState(initialView);
  
  // Блокировка прокрутки страницы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Обработчик нажатия Escape для закрытия модального окна
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Обработчик клика по фону для закрытия модального окна
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Обработчики успешной авторизации/регистрации
  const handleLoginSuccess = () => {
    console.log("Login successful, closing modal");
    setTimeout(() => onClose(), 500); // Задержка для лучшего UX
  };

  const handleRegisterSuccess = () => {
    console.log("Registration successful, waiting for auth synchronization");
    
    // Longer delay to ensure all auth processes complete
    setTimeout(() => {
      console.log("Auth sync completed, closing modal");
      
      // Force a state refresh by dispatching a custom event
      try {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
        
        // Reload window state instead of just closing modal
        window.location.reload();
      } catch (error) {
        console.error("Error during auth refresh:", error);
        onClose();
      }
    }, 1500);
  };
  
  if (!isOpen) return null;
  
  // Рендерим модальное окно через портал
  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX />
        </button>
        
        <div className={styles.modalContent}>
          <div className={styles.patternOverlay}></div>
          
          <div className={styles.formWrapper}>
            {view === 'login' ? (
              <LoginForm 
                onSwitchToRegister={() => setView('register')} 
                onSuccess={handleLoginSuccess}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setView('login')} 
                onSuccess={handleRegisterSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default AuthModal; 