import styled from 'styled-components';
import { motion } from 'framer-motion';

// Dropdown Components for Comments
export const CommentActionsDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

export const DropdownToggle = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: var(--bg-hover);
  }
  
  svg {
    font-size: 18px;
  }
`;

export const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 100;
  overflow: hidden;
  
  [data-theme="dark"] & {
    background: var(--bg-tertiary);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  }
`;

export const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: none;
  border: none;
  color: ${props => props.$danger ? 'var(--error)' : 'var(--text-primary)'};
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.$danger ? 'rgba(231, 76, 60, 0.1)' : 'var(--bg-hover)'};
  }
  
  svg {
    font-size: 16px;
  }
`;

// Responsive CSS Blocks
export const commentResponsiveStyles = `
  .commentActions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  
  .replyButton,
  .deleteCommentButton {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .replyButton:hover,
  .deleteCommentButton:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .deleteCommentButton {
    color: #e74c3c;
  }
  
  .commentItem {
    position: relative;
    overflow: hidden;
  }
  
  @media (max-width: 576px) {
    .commentActions {
      width: 100%;
    }
    
    .replyButton,
    .deleteCommentButton {
      font-size: 12px;
      padding: 3px 6px;
    }
  }
`;

export const mobileCommentResponsiveStyles = `
  @media (max-width: 576px) {
    .commentItem {
      position: relative;
    }
    
    .commentHeader {
      padding-right: 30px;
    }
    
    .mobileOnly {
      display: block;
    }
    
    .desktopOnly {
      display: none;
    }
  }
  
  @media (min-width: 577px) {
    .mobileOnly {
      display: none;
    }
    
    .desktopOnly {
      display: flex;
    }
  }
`;

export const slideActionStyles = `
  .commentItem {
    position: relative;
    overflow: hidden;
  }
  
  .commentSwipeActions {
    position: absolute;
    right: -100px;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    transition: transform 0.3s ease;
    touch-action: pan-y;
  }
  
  .commentActionButton {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-right: 10px;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
  }
  
  .replyAction {
    background-color: var(--accent, #1da1f2);
  }
  
  .deleteAction {
    background-color: var(--error, #e74c3c);
  }
  
  .commentContent {
    transition: transform 0.3s ease;
  }
  
  .commentInner {
    position: relative;
    width: 100%;
    padding-right: 10px;
    transition: transform 0.3s ease;
  }
  
  @media (max-width: 576px) {
    .commentInner.swiped {
      transform: translateX(-100px);
    }
    
    .commentActions.mobileOnly {
      position: absolute;
      right: 10px;
      top: 10px;
    }
  }
`; 