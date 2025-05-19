import styled, { keyframes } from 'styled-components';
import { FiCheck, FiBarChart2 } from 'react-icons/fi';

// Animations
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Poll Components
export const PollWrapper = styled.div`
  background: var(--bg-highlight, #f5f8fa);
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid var(--border, #e1e8ed);
  
  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  &::before {
    display: none;
  }
`;

export const PollQuestion = styled.h4`
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  
  &:before {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    background-color: var(--accent, #1da1f2);
    margin-right: 10px;
    border-radius: 4px;
  }
`;

export const PollOptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

export const PollOption = styled.div`
  position: relative;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  opacity: ${props => props.$disabled ? '0.8' : '1'};
`;

export const PollOptionButton = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border, #e1e8ed);
  background: ${props => props.$isSelected ? 'rgba(29, 161, 242, 0.1)' : 'transparent'};
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$disabled ? 'transparent' : 'rgba(29, 161, 242, 0.05)'};
  }
  
  [data-theme="dark"] & {
    border-color: rgba(255, 255, 255, 0.1);
    background: ${props => props.$isSelected ? 'rgba(29, 161, 242, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: var(--text-primary);
    
    &:hover {
      background: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(29, 161, 242, 0.1)'};
    }
    
    ${props => props.$isSelected && `
      box-shadow: 0 0 5px rgba(29, 161, 242, 0.3);
      border-color: rgba(29, 161, 242, 0.5);
    `}
  }
`;

export const OptionText = styled.span`
  color: var(--text-primary) !important;
  font-weight: ${props => props.$isSelected ? '600' : '400'};
  font-size: 15px;
  margin-left: ${props => props.$isVoted ? '8px' : '0'};
  flex-grow: 1;
  
  // Force color to adapt to theme
  [data-theme="dark"] & {
    color: var(--text-primary) !important;
    ${props => props.$isSelected && `
      text-shadow: 0 0 1px rgba(255, 255, 255, 0.2);
    `}
  }
`;

export const CheckIcon = styled(FiCheck)`
  color: var(--accent, #1da1f2);
  margin-right: 10px;
  
  [data-theme="dark"] & {
    color: white;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.7));
  }
`;

export const PercentageText = styled.span`
  color: var(--accent, #1da1f2);
  font-weight: 600;
  font-size: 14px;
  margin-left: auto;
  
  [data-theme="dark"] & {
    color: white;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
`;

export const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
  
  [data-theme="dark"] & {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

export const ProgressBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, var(--accent, #1da1f2) 0%, rgba(29, 161, 242, 0.6) 100%);
  width: ${props => props.$width}%;
  border-radius: 3px;
  transition: width 0.5s ease-out;
  
  [data-theme="dark"] & {
    background: linear-gradient(90deg, #1d9cf2 0%, #36c3ff 100%);
    box-shadow: 0 0 5px rgba(29, 161, 242, 0.5);
  }
`;

export const VotesCount = styled.div`
  text-align: right;
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 10px;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  
  [data-theme="dark"] & {
    color: rgba(255, 255, 255, 0.6);
  }
`;

export const BarChartIcon = styled(FiBarChart2)`
  margin-right: 5px;
`; 