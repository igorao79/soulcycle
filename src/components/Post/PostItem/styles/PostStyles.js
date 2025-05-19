import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import { AiOutlinePushpin } from 'react-icons/ai';

// Animations
const gradientBorder = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Button Components
export const LikeButton = styled(motion.button)`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
`;

export const PinButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--accent);
  }
  
  svg {
    font-size: 16px;
    ${props => props.$isPinned && 'transform: rotate(45deg);'}
  }
  
  [data-theme="dark"] & {
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Badge components
export const AdminViewBadge = styled.span`
  font-size: 12px;
  background-color: #5c6bc0;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 8px;
  font-weight: 500;

  [data-theme="dark"] & {
    background-color: #3949ab;
  }
`;

export const PinnedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--accent);
  background-color: var(--accent-light);
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
  margin-bottom: 5px;
  
  svg {
    font-size: 12px;
    transform: rotate(45deg);
  }
  
  @media (max-width: 576px) {
    font-size: 11px;
    padding: 2px 6px;
  }
  
  /* Для темной темы */
  [data-theme="dark"] & {
    background-color: rgba(29, 161, 242, 0.25);
    color: #ffffff;
    box-shadow: 0 0 5px rgba(29, 161, 242, 0.3);
  }
`;

// Container components
export const PinnedPostContainer = styled.div`
  position: relative;
  border-radius: 16px;
  margin-bottom: 20px;
  
  /* Create an animated gradient border effect */
  &:before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 18px;
    padding: 3px;
    background: linear-gradient(
      45deg, 
      var(--accent, #1da1f2) 0%, 
      rgba(255, 255, 255, 0.3) 50%, 
      var(--accent, #1da1f2) 100%
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    background-size: 300% 300%;
    animation: ${gradientBorder} 4s ease infinite;
    opacity: 0.8;
    
    [data-theme="dark"] & {
      background: linear-gradient(
        45deg, 
        var(--accent, #1da1f2) 0%, 
        rgba(29, 161, 242, 0.7) 50%, 
        var(--accent, #1da1f2) 100%
      );
      opacity: 0.95;
      box-shadow: 0 0 18px rgba(29, 161, 242, 0.5);
    }
  }
`;

export const CommentSection = styled(motion.div)`
  overflow: hidden;
`;

// Warning Message
export const WarningMessage = styled(motion.div)`
  background-color: rgba(255, 152, 0, 0.1);
  border-left: 4px solid var(--accent, #1da1f2);
  padding: 12px 16px;
  margin: 12px 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  
  svg {
    color: var(--accent, #1da1f2);
    font-size: 20px;
    flex-shrink: 0;
  }
  
  span {
    font-size: 14px;
    color: var(--text-primary);
  }
  
  button {
    background-color: var(--accent, #1da1f2);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    margin-left: auto;
    transition: all 0.2s;
    
    &:hover {
      background-color: rgba(29, 161, 242, 0.8);
    }
  }
`;

// Animation variants
export const animationVariants = {
  initial: { 
    opacity: 0, 
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0
  },
  animate: { 
    opacity: 1, 
    height: 'auto',
    marginTop: '12px',
    marginBottom: '12px',
    paddingTop: '12px',
    paddingBottom: '12px',
    transition: {
      opacity: { duration: 0.3, ease: 'easeInOut' },
      height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
      marginTop: { duration: 0.3, ease: 'easeOut' },
      marginBottom: { duration: 0.3, ease: 'easeOut' },
      paddingTop: { duration: 0.3, ease: 'easeOut' },
      paddingBottom: { duration: 0.3, ease: 'easeOut' }
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: {
      opacity: { duration: 0.2, ease: 'easeInOut' },
      height: { duration: 0.3, delay: 0.1, ease: [0.04, 0.62, 0.23, 0.98] },
      marginTop: { duration: 0.2, ease: 'easeIn' },
      marginBottom: { duration: 0.2, ease: 'easeIn' },
      paddingTop: { duration: 0.2, ease: 'easeIn' },
      paddingBottom: { duration: 0.2, ease: 'easeIn' }
    }
  }
};

export const commentSectionVariants = {
  initial: { 
    opacity: 0, 
    height: 0,
    overflow: 'hidden'
  },
  animate: { 
    opacity: 1, 
    height: 'auto',
    transition: {
      height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
      opacity: { duration: 0.3, ease: 'easeInOut' }
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: {
      height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
      opacity: { duration: 0.2, ease: 'easeInOut' }
    }
  }
};

export const dropdownVariants = {
  initial: { 
    opacity: 0, 
    y: -5,
    scale: 0.95,
    transformOrigin: 'top right'
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.04, 0.62, 0.23, 0.98]
    }
  },
  exit: { 
    opacity: 0, 
    y: -5,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.04, 0.62, 0.23, 0.98]
    }
  }
}; 