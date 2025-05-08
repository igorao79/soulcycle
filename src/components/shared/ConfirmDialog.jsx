import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiCheck } from 'react-icons/fi';

// Overlay for the modal
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(33, 33, 38, 0.85) 0%, rgba(68, 68, 77, 0.85) 100%);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  will-change: transform;
`;

// Modal container
const DialogContainer = styled(motion.div)`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  border: 1px solid var(--border);
  will-change: transform;
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

// Dialog content
const DialogContent = styled.div`
  color: var(--text-secondary);
  margin-bottom: 24px;
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
  
  // Prevent scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflow = 'auto';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <DialogContainer
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog; 