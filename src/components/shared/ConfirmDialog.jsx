import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiCheck } from 'react-icons/fi';

// Overlay for the modal - updated to match AuthModal styling
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, rgba(33, 33, 38, 0.85) 0%, rgba(68, 68, 77, 0.85) 100%);
  backdrop-filter: blur(8px);
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

// Modal container - updated to match AuthModal styling
const DialogContainer = styled(motion.div)`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--modal-shadow, 0 8px 30px rgba(0, 0, 0, 0.2));
  position: relative;
  border: 1px solid var(--modal-border, var(--border));
  backdrop-filter: blur(10px);
  transform-style: preserve-3d;
  margin: auto;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

// Dialog content - updated to ensure proper scroll behavior
const DialogContent = styled.div`
  color: var(--text-secondary);
  margin-bottom: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 150px);
`;

// Dialog header
const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

// Dialog title
const DialogTitle = styled.h3`
  color: var(--text-primary);
  font-size: 18px;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: var(--error);
  }
`;

// Close button
const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--bg-highlight);
  }
`;

// Dialog actions container
const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

// Cancel button
const CancelButton = styled.button`
  background: var(--bg-highlight);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: var(--background-color);
  }
`;

// Confirm button
const ConfirmButton = styled.button`
  background: var(--error);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    opacity: 0.9;
  }
`;

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};

const dialogVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: -20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Подтверждение', 
  message = 'Вы уверены?', 
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  isDanger = true
}) => {
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Create a more reliable scroll lock
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling on main page
      document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        // Restore scroll position
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Use ReactDOM.createPortal to render the modal outside the normal DOM hierarchy
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
          <DialogHeader>
            <DialogTitle>
              {isDanger && <FiAlertTriangle size={20} />}
              {title}
            </DialogTitle>
            <CloseButton onClick={onClose}>
              <FiX size={18} />
            </CloseButton>
          </DialogHeader>
          
          <DialogContent>{message}</DialogContent>
          
          <DialogActions>
            <CancelButton onClick={onClose}>
              <FiX size={16} />
              {cancelText}
            </CancelButton>
            <ConfirmButton onClick={onConfirm} style={{ 
              background: isDanger ? 'var(--error)' : 'var(--accent)' 
            }}>
              <FiCheck size={16} />
              {confirmText}
            </ConfirmButton>
          </DialogActions>
        </DialogContainer>
      </Overlay>
    </AnimatePresence>,
    document.getElementById('modal-root') || document.body
  );
};

export default ConfirmDialog; 