import React, { useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBook } from 'react-icons/fi';
import { ThemeContext } from '../theme/ThemeContext';

// Overlay for the modal
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(33, 33, 38, 0.85) 0%, 
    rgba(68, 68, 77, 0.85) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  perspective: 1000px;
  box-sizing: border-box;
  overscroll-behavior: contain;
  transform: translateZ(0);
  isolation: isolate;
  padding: 20px;
`;

// Modal container
const DialogContainer = styled(motion.div)`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 600px;
  box-shadow: var(--modal-shadow, 0 8px 30px rgba(0, 0, 0, 0.2));
  position: relative;
  border: 1px solid var(--modal-border, var(--border));
  transform-style: preserve-3d;
  margin: auto;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

// Dialog content
const DialogContent = styled.div`
  color: var(--text-primary);
  margin-bottom: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 150px);
  padding-right: 10px;
  font-feature-settings: "kern" 1, "liga" 1;
  text-rendering: optimizeLegibility;
  
  h3 {
    color: var(--text-primary);
    margin: 20px 0 10px;
    font-weight: 600;
    font-size: 18px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  p {
    margin: 10px 0;
    line-height: 1.6;
    font-size: 15px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  ul, ol {
    margin: 10px 0;
    padding-left: 20px;
    font-size: 14px;
    
    li {
      margin-bottom: 8px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  }
  
  .highlight {
    background: lightgray;
    padding: 2px 4px;
    border-radius: 4px;
    color: var(--accent);
    font-weight: 500;
  }
  
  @media (max-width: 480px) {
    h3 {
      font-size: 17px;
    }
    
    p {
      font-size: 14px;
    }
    
    ul, ol {
      font-size: 13px;
    }
  }
`;

// Dialog header
const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

// Dialog title
const DialogTitle = styled.h2`
  color: var(--text-primary);
  font-size: 22px;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: var(--accent);
  }
`;

// Close button
const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--bg-highlight);
    color: var(--text-primary);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

// Divider
const Divider = styled.div`
  height: 1px;
  background: var(--border);
  margin: 16px 0;
  width: 100%;
`;

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const dialogVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    rotateX: 5
  },
  visible: { 
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { 
      duration: 0.4,
      ease: [0.19, 1, 0.22, 1],
      delay: 0.1
    }
  },
  exit: { 
    opacity: 0,
    y: 20,
    transition: { duration: 0.3 }
  }
};

/**
 * Компонент модального окна с правилами сообщества
 */
const RulesModal = ({ isOpen, onClose }) => {
  const { theme } = useContext(ThemeContext);
  
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
  
  // Обработчик клика по фону для закрытия модального окна
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
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
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <AnimatePresence mode="wait">
      <Overlay
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={handleBackdropClick}
      >
        <DialogContainer
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
          
          <DialogHeader>
            <DialogTitle>
              <FiBook size={24} />
              Правила сообщества
            </DialogTitle>
          </DialogHeader>
          
          <Divider />
          
          <DialogContent>
            <h3>1. Общие правила</h3>
            <p>Добро пожаловать в наше сообщество! Эти правила помогут создать комфортную и безопасную среду для всех участников:</p>
            <ul>
              <li>Относитесь к другим участникам с уважением</li>
              <li>Запрещены оскорбления, унижения, травля и дискриминация</li>
              <li>Уважайте личное пространство и частную информацию других пользователей</li>
              <li>Не публикуйте контент, нарушающий законодательство РФ</li>
            </ul>
            
            <h3>2. Публикации и комментарии</h3>
            <p>При создании постов и комментариев просим придерживаться следующих принципов:</p>
            <ul>
              <li>Используйте <span className="highlight">понятный и уважительный язык</span></li>
              <li>Не используйте нецензурную лексику и оскорбительные выражения</li>
              <li>Не публикуйте спам, рекламу и другой нежелательный контент</li>
              <li>Избегайте публикации недостоверной информации</li>
              <li>Не публикуйте спойлеры</li>
            </ul>
            
            
            <h3>3. Профиль и личные данные</h3>
            <p>Обеспечение безопасности ваших данных - наш приоритет:</p>
            <ul>
              <li>Не публикуйте личную информацию других пользователей</li>
              <li>Не размещайте в публичном доступе свои персональные данные</li>
              <li>Выбирайте безопасные пароли и не передавайте их третьим лицам</li>
            </ul>
            
            <h3>4. Нарушения и санкции</h3>
            <p>За нарушение правил могут последовать:</p>
            <ul>
              <li>Предупреждение от модерации</li>
              <li>Временная блокировка аккаунта</li>
            </ul>
            
            <p>Правила могут обновляться и дополняться. Следите за изменениями в этом разделе.</p>
          </DialogContent>
        </DialogContainer>
      </Overlay>
    </AnimatePresence>,
    document.getElementById('modal-root') || document.body
  );
};

export default RulesModal;  