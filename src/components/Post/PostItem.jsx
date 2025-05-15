import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/postService';
import commentService from '../../services/commentService';
import styles from './Post.module.scss';
import perkStyles from '../../styles/Perks.module.scss';
import styled, { keyframes } from 'styled-components';
import { 
  FiHeart, FiMessageSquare, FiClock, FiTrash2, 
  FiSend, FiAlertCircle, FiLoader, FiMessageCircle,
  FiCornerDownRight, FiX, FiBarChart2, FiCheck,
  FiAlertTriangle, FiInfo, FiMoreVertical, FiEdit, FiPlus
} from 'react-icons/fi';
import { AiOutlinePushpin } from 'react-icons/ai';
import filterBadWords from '../../utils/filterBadWords';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../shared/ConfirmDialog';
import OptimizedAvatar from '../shared/OptimizedAvatar';
import { FiImage } from 'react-icons/fi';

// Cloudinary URL for image optimization with advanced parameters
const CLOUDINARY_URL = 'https://res.cloudinary.com/do9t8preg/image/fetch/f_auto,q_auto:best,dpr_auto,w_auto,c_limit,w_800/';

// Global cache for optimized URLs to prevent duplicate transformations
const optimizedUrlCache = new Map();

// Function to get optimized URL with caching
const getOptimizedUrl = (originalUrl) => {
  if (!originalUrl || typeof originalUrl !== 'string') {
    return null;
  }
  
  // Return cached URL if available
  if (optimizedUrlCache.has(originalUrl)) {
    return optimizedUrlCache.get(originalUrl);
  }
  
  // Skip URLs that are already optimized
  if (originalUrl.includes('res.cloudinary.com/do9t8preg/image/fetch')) {
    optimizedUrlCache.set(originalUrl, originalUrl);
    return originalUrl;
  }
  
  // Skip data URLs
  if (originalUrl.startsWith('data:image/')) {
    optimizedUrlCache.set(originalUrl, originalUrl);
    return originalUrl;
  }
  
  try {
    // Generate optimized URL
    const optimizedUrl = `${CLOUDINARY_URL}${encodeURIComponent(originalUrl)}`;
    optimizedUrlCache.set(originalUrl, optimizedUrl);
    return optimizedUrl;
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return originalUrl;
  }
};

// Функция для форматирования даты
const formatRelativeTime = (dateString, isMobile = false) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Вычисляем разницу во времени
  const seconds = diffInSeconds;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // Возвращаем отформатированную строку в зависимости от устройства
  if (seconds < 60) {
    return 'только что';
  } else if (minutes < 60) {
    // Для мобильных используем короткий формат
    return isMobile 
      ? `${minutes}м` 
      : `${minutes} ${declOfNum(minutes, ['минуту', 'минуты', 'минут'])} назад`;
  } else if (hours < 24) {
    return isMobile 
      ? `${hours}ч` 
      : `${hours} ${declOfNum(hours, ['час', 'часа', 'часов'])} назад`;
  } else if (days < 7) {
    return isMobile 
      ? `${days}д` 
      : `${days} ${declOfNum(days, ['день', 'дня', 'дней'])} назад`;
  } else if (weeks < 4) {
    return isMobile 
      ? `${weeks}нед` 
      : `${weeks} ${declOfNum(weeks, ['неделю', 'недели', 'недель'])} назад`;
  } else if (months < 12) {
    return isMobile 
      ? `${months}мес` 
      : `${months} ${declOfNum(months, ['месяц', 'месяца', 'месяцев'])} назад`;
  } else {
    return isMobile 
      ? `${years}г` 
      : `${years} ${declOfNum(years, ['год', 'года', 'лет'])} назад`;
  }
};

// Функция для склонения существительных
const declOfNum = (number, titles) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    number % 100 > 4 && number % 100 < 20 
      ? 2 
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
};

// Стили для компонента опросов
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PollWrapper = styled.div`
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

const PollQuestion = styled.h4`
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

const PollOptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const PollOption = styled.div`
  position: relative;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  opacity: ${props => props.$disabled ? '0.8' : '1'};
`;

const PollOptionButton = styled.div`
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

const OptionText = styled.span`
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

const CheckIcon = styled(FiCheck)`
  color: var(--accent, #1da1f2);
  margin-right: 10px;
  
  [data-theme="dark"] & {
    color: white;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.7));
  }
`;

const PercentageText = styled.span`
  color: var(--accent, #1da1f2);
  font-weight: 600;
  font-size: 14px;
  margin-left: auto;
  
  [data-theme="dark"] & {
    color: white;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
`;

const ProgressBarContainer = styled.div`
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

const ProgressBarFill = styled.div`
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

const VotesCount = styled.div`
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

// Стили для бейджа администратора
const AdminViewBadge = styled.span`
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

// Custom warning component with improved transitions
const WarningMessage = styled(motion.div)`
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

// Improved animation variants for smoother transitions
const animationVariants = {
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

// Add CommentSection animation variants
const commentSectionVariants = {
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

// Add dropdown animation variants
const dropdownVariants = {
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

// Компонент для отображения опроса
const PollComponent = ({ poll, postId, onVote, hasVoted, votedOption, results, isAdmin, user }) => {
  const { isAuthenticated } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  
  // Получаем цвета для стилизации опроса
  const pollOptionsColor = poll.optionsColor || (poll.styling && poll.styling.optionsColor) || null;
  const pollFontFamily = (poll.styling && poll.styling.fontFamily) || 'inherit';
  
  // Рассчитываем общее количество голосов непосредственно из results при каждом рендере
  const totalVotes = useMemo(() => {
    if (!results || !Array.isArray(results)) return 0;
    return results.reduce((sum, result) => sum + (result.votes || 0), 0);
  }, [results]);
  
  // Алгоритм правильного распределения процентов с гарантированной суммой 100%
  const pollPercentages = useMemo(() => {
    if (!results || !Array.isArray(results) || totalVotes === 0) {
      return poll.options.map(() => 0);
    }
    
    // Сначала вычисляем точные проценты с плавающей точкой
    const exactPercentages = results.map(result => (result.votes / totalVotes) * 100);
    
    // Округляем вниз и считаем, сколько процентов "потеряли" из-за округления
    const roundedDown = exactPercentages.map(p => Math.floor(p));
    const remainingPercent = 100 - roundedDown.reduce((sum, p) => sum + p, 0);
    
    // Сортируем индексы по дробной части (от большей к меньшей)
    const indices = exactPercentages.map((p, i) => i);
    indices.sort((a, b) => (exactPercentages[b] - Math.floor(exactPercentages[b])) - 
                           (exactPercentages[a] - Math.floor(exactPercentages[a])));
    
    // Распределяем оставшиеся проценты тем вариантам, у которых больше дробная часть
    const finalPercentages = [...roundedDown];
    for (let i = 0; i < remainingPercent; i++) {
      finalPercentages[indices[i % indices.length]]++;
    }
    
    console.log('Exact percentages:', exactPercentages);
    console.log('Final percentages with correct distribution:', finalPercentages);
    console.log('Total sum:', finalPercentages.reduce((sum, p) => sum + p, 0));
    
    return finalPercentages;
  }, [results, totalVotes, poll.options.length]);
  
  // Выводим детальную отладочную информацию
  useEffect(() => {
    console.log('PollComponent render:');
    console.log('- Poll:', poll);
    console.log('- Results:', results);
    console.log('- Total votes calculated:', totalVotes);
    console.log('- Calculated percentages:', pollPercentages);
    
    if (results && Array.isArray(results)) {
      // Проверяем расчет процентов
      results.forEach((result, idx) => {
        console.log(`Option "${result.option}": ${result.votes}/${totalVotes} = ${pollPercentages[idx]}%`);
      });
    }
  }, [poll, results, totalVotes, pollPercentages]);

  const handleVote = async (optionIndex) => {
    if (!isAuthenticated) {
      setShowAuthWarning(true);
      return;
    }
    
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    setVoteError(null);
    
    try {
      await onVote(optionIndex);
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      setVoteError(error.message || 'Ошибка при голосовании. Пожалуйста, попробуйте позже.');
      setTimeout(() => setVoteError(null), 5000);
    } finally {
      setIsVoting(false);
    }
  };

  // Админы видят результаты без голосования
  const showResults = hasVoted || isAdmin;

  return (
    <PollWrapper>
      {!poll.hideQuestion && (
        <PollQuestion>{poll.question}</PollQuestion>
      )}
      
      {voteError && (
        <div style={{
          padding: '10px',
          margin: '10px 0',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderLeft: '3px solid red',
          color: 'var(--text-primary)',
          fontSize: '14px'
        }}>
          {voteError}
        </div>
      )}
      
      <PollOptionsList>
        {poll.options.map((option, index) => {
          // Находим результат для этой опции - сначала по тексту опции, потом по индексу
          let result;
          if (results && Array.isArray(results)) {
            // Сначала пробуем найти по точному совпадению текста
            result = results.find(r => r.option === option);
            
            // Если не нашли по тексту, используем индекс
            if (!result && results[index]) {
              result = results[index];
            }
            
            // Если все равно не нашли, создаем пустой результат
            if (!result) {
              result = { option, votes: 0 };
            }
          } else {
            // Если results не массив или не существует, создаем пустой результат
            result = { option, votes: 0 };
          }
          
          // Используем заранее рассчитанные проценты с гарантированной суммой 100%
          const percent = showResults ? pollPercentages[index] || 0 : 0;
          
          const isSelected = votedOption === index;
          
          return (
            <PollOption 
              key={`option-${index}-${option}`} 
              onClick={() => hasVoted ? null : handleVote(index)}
              $disabled={hasVoted || isVoting}
            >
              <PollOptionButton $isSelected={isSelected} $disabled={hasVoted || isVoting}>
                {isVoting && index === votedOption && (
                  <span style={{marginRight: '8px'}}>⏳</span>
                )}
                {isSelected && <CheckIcon />}
                <OptionText 
                  $isSelected={isSelected} 
                  $isVoted={hasVoted}
                  style={{
                    color: pollOptionsColor || 'inherit',
                    fontFamily: pollFontFamily
                  }}
                >
                  {option}
                </OptionText>
                {showResults && (
                  <PercentageText>{percent}%</PercentageText>
                )}
              </PollOptionButton>
              
              {showResults && (
                <ProgressBarContainer>
                  <ProgressBarFill $width={percent} />
                </ProgressBarContainer>
              )}
            </PollOption>
          );
        })}
      </PollOptionsList>
      
      {showAuthWarning && (
        <WarningMessage 
          variants={animationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <FiInfo />
          <span>Войдите, чтобы проголосовать</span>
          <button onClick={() => setShowAuthWarning(false)}>Скрыть</button>
        </WarningMessage>
      )}
      
      <VotesCount>
        {isAdmin && !hasVoted && (
          <AdminViewBadge>Просмотр администратора</AdminViewBadge>
        )}
        <FiBarChart2 />
        {totalVotes} {declOfNum(totalVotes, ['голос', 'голоса', 'голосов'])}
      </VotesCount>
    </PollWrapper>
  );
};

// Add responsive styles for comments
const commentResponsiveStyles = `
  .${styles.commentActions} {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  
  .${styles.replyButton},
  .${styles.deleteCommentButton} {
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
  
  .${styles.replyButton}:hover,
  .${styles.deleteCommentButton}:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .${styles.deleteCommentButton} {
    color: #e74c3c;
  }
  
  .${styles.commentItem} {
    position: relative;
    overflow: hidden;
  }
  
  @media (max-width: 576px) {
    .${styles.commentActions} {
      width: 100%;
    }
    
    .${styles.replyButton},
    .${styles.deleteCommentButton} {
      font-size: 12px;
      padding: 3px 6px;
    }
  }
`;

// Add a mobile-friendly dropdown menu for comment actions
const CommentActionsDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownToggle = styled.button`
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

const DropdownMenu = styled(motion.div)`
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

const DropdownItem = styled.button`
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

// Add this to the responsive styles for comments
const mobileCommentResponsiveStyles = `
  @media (max-width: 576px) {
    .${styles.commentItem} {
      position: relative;
    }
    
    .${styles.commentHeader} {
      padding-right: 30px;
    }
    
    .${styles.mobileOnly} {
      display: block;
    }
    
    .${styles.desktopOnly} {
      display: none;
    }
  }
  
  @media (min-width: 577px) {
    .${styles.mobileOnly} {
      display: none;
    }
    
    .${styles.desktopOnly} {
      display: flex;
    }
  }
`;

// Add slide-in action styles for comments
const slideActionStyles = `
  .${styles.commentItem} {
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
    
    .${styles.commentActions}.${styles.mobileOnly} {
      position: absolute;
      right: 10px;
      top: 10px;
    }
  }
`;

// Компонент комментария
function CommentItem({ comment, onReply, onDelete }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplyDeleteConfirm, setShowReplyDeleteConfirm] = useState({});
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swiped, setSwiped] = useState(false);
  const commentRef = useRef(null);
  
  // Проверяем, является ли пользователь администратором
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  const isCommentOwner = user && user.id === comment.user_id;
  const canDeleteComment = isAdmin || isCommentOwner;
  
  // Handle touch events for swipeable actions
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    if (touchStart && touchEnd) {
      const distance = touchStart - touchEnd;
      
      // Only allow right-to-left swipe (negative distance)
      if (distance > 20 && distance < 120) {
        const transform = -distance;
        if (commentRef.current) {
          commentRef.current.style.transform = `translateX(${transform}px)`;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    
    // If swiped far enough, show action buttons
    if (distance > 70) {
      setSwiped(true);
    } else {
      setSwiped(false);
      if (commentRef.current) {
        commentRef.current.style.transform = 'translateX(0)';
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // Reset swipe state when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commentRef.current && !commentRef.current.contains(e.target)) {
        setSwiped(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleReplyClick = () => {
    if (!isAuthenticated) {
      setShowAuthWarning('reply');
      return;
    }
    
    // Переключаем состояние формы ответа
    setShowReplyForm(prevState => !prevState);
    setShowActionsDropdown(false);
    
    // Если форма открывается, то фокусируемся на текстовом поле
    if (!showReplyForm) {
      setTimeout(() => {
        const textareas = document.querySelectorAll(`.${styles.replyForm} textarea`);
        if (textareas.length > 0) {
          textareas[textareas.length - 1].focus();
        }
      }, 100);
    }
    
    // Добавляем логирование для отладки
    console.log('Нажата кнопка "Ответить":', comment.id, 'Форма будет отображена:', !showReplyForm);
  };
  
  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyContent('');
  };
  
  const openDeleteConfirm = () => {
    if (!canDeleteComment) return;
    setShowDeleteConfirm(true);
    setShowActionsDropdown(false);
  };
  
  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };
  
  const handleDeleteComment = async () => {
    if (!canDeleteComment) return;
    
    try {
      setIsDeleting(true);
      await commentService.deleteComment(comment.id, user.id);
      onDelete(comment.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      alert('Не удалось удалить комментарий: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Функции для работы с ответами на комментарии
  const openReplyDeleteConfirm = (replyId) => {
    setShowReplyDeleteConfirm(prev => ({
      ...prev,
      [replyId]: true
    }));
  };
  
  const closeReplyDeleteConfirm = (replyId) => {
    setShowReplyDeleteConfirm(prev => ({
      ...prev,
      [replyId]: false
    }));
  };
  
  const handleDeleteReply = async (replyId, userId) => {
    const isReplyOwner = user && user.id === userId;
    const canDeleteReply = isAdmin || isReplyOwner;
    
    if (!canDeleteReply) return;
    
    try {
      await commentService.deleteComment(replyId, user?.id);
      onDelete(replyId);
      closeReplyDeleteConfirm(replyId);
    } catch (error) {
      console.error('Ошибка при удалении ответа:', error);
      alert('Не удалось удалить ответ: ' + (error.message || 'Неизвестная ошибка'));
    }
  };
  
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      return;
    }
    
    try {
      setIsSubmittingReply(true);
      
      // Применяем фильтр нецензурных слов к тексту ответа, передавая объект пользователя
      const filteredContent = filterBadWords(replyContent, user);
      
      await onReply(comment.id, filteredContent);
      
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  return (
    <div className={styles.commentItem}>
      {/* Inject responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: commentResponsiveStyles }} />
      
      <div className="commentInner">
        <div className={styles.commentHeader}>
          <div className={styles.commentAuthorAvatar}>
            <OptimizedAvatar src={comment.author.avatar} alt={comment.author.displayName} className={styles.avatar} />
          </div>
          <div className={styles.commentAuthorInfo}>
            <Link to={`/profile/${comment.user_id}`} className={styles.commentAuthor}>
              <span 
                className={
                  comment.author.activePerk === 'early_user' 
                    ? perkStyles.earlyUserPerk
                    : comment.author.activePerk === 'sponsor' 
                    ? perkStyles.sponsorPerk
                    : comment.author.activePerk === 'admin' 
                    ? perkStyles.adminPerk
                    : perkStyles.userPerk
                }
                style={{
                  display: 'inline-block',
                  margin: 0,
                  padding: 0
                }}
              >
                {comment.author.displayName}
              </span>
            </Link>
          </div>
        </div>
        
        <div className={styles.commentContent}>{comment.content}</div>
        
        <div className={styles.commentDate}>
          <FiClock /> {formatRelativeTime(comment.created_at)}
        </div>
        
        {/* Унифицированные кнопки действий */}
        <div className={styles.commentActions}>
          <button 
            className={styles.replyButton}
            onClick={handleReplyClick}
          >
            <FiCornerDownRight /> Ответить
          </button>
          
          {canDeleteComment && (
            <button
              className={styles.deleteCommentButton}
              onClick={openDeleteConfirm}
              disabled={isDeleting}
            >
              <FiTrash2 /> {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteComment}
        title="Удаление комментария"
        message="Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        isDanger={true}
      />
      
      {/* Форма для ответа на комментарий */}
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} className={styles.replyForm}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Напишите ответ..."
            disabled={isSubmittingReply}
          />
          <div className={styles.replyFormActions}>
            <button 
              type="button" 
              onClick={handleCancelReply} 
              className={styles.cancelReplyButton}
              disabled={isSubmittingReply}
            >
              <FiX /> Отмена
            </button>
            <button 
              type="submit" 
              className={styles.submitReplyButton}
              disabled={isSubmittingReply}
            >
              {isSubmittingReply ? (
                <>
                  <FiLoader /> Отправка...
                </>
              ) : (
                <>
                  <FiSend /> Ответить
                </>
              )}
            </button>
          </div>
        </form>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {comment.replies.map(reply => {
            const isReplyOwner = user && user.id === reply.user_id;
            const canDeleteReply = isAdmin || isReplyOwner;
            
            return (
              <div key={reply.id} className={`${styles.commentItem} ${styles.commentReply}`}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentAuthorAvatar}>
                    <OptimizedAvatar src={reply.author.avatar} alt={reply.author.displayName} className={styles.avatar} />
                  </div>
                  <div className={styles.commentAuthorInfo}>
                    <Link to={`/profile/${reply.user_id}`} className={styles.commentAuthor}>
                      <span 
                        className={
                          reply.author.activePerk === 'early_user' 
                            ? perkStyles.earlyUserPerk
                            : reply.author.activePerk === 'sponsor' 
                            ? perkStyles.sponsorPerk
                            : reply.author.activePerk === 'admin' 
                            ? perkStyles.adminPerk
                            : perkStyles.userPerk
                        }
                        style={{
                          display: 'inline-block',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        {reply.author.displayName}
                      </span>
                    </Link>
                  </div>
                  
                  {/* Mobile dropdown for reply actions */}
                  {canDeleteReply && (
                    <div className={styles.mobileOnly} style={{ position: 'absolute', top: '5px', right: '5px' }}>
                      <CommentActionsDropdown onClick={e => e.stopPropagation()}>
                        <DropdownToggle onClick={() => setShowReplyDeleteConfirm({
                          ...showReplyDeleteConfirm,
                          [reply.id]: true
                        })}>
                          <FiMoreVertical />
                        </DropdownToggle>
                      </CommentActionsDropdown>
                    </div>
                  )}
                </div>
                
                <div className={styles.commentContent}>{reply.content}</div>
                
                <div className={styles.commentDate}>
                  <FiClock /> {formatRelativeTime(reply.created_at)}
                </div>
                
                {canDeleteReply && (
                  <div className={`${styles.commentActions} ${styles.desktopOnly}`}>
                    <button
                      className={styles.deleteCommentButton}
                      onClick={() => setShowReplyDeleteConfirm({
                        ...showReplyDeleteConfirm,
                        [reply.id]: true
                      })}
                    >
                      <FiTrash2 /> Удалить
                    </button>
                  </div>
                )}
                
                {/* Reply Delete confirmation dialog */}
                <ConfirmDialog
                  isOpen={showReplyDeleteConfirm[reply.id] || false}
                  onClose={() => setShowReplyDeleteConfirm({
                    ...showReplyDeleteConfirm,
                    [reply.id]: false
                  })}
                  onConfirm={() => handleDeleteReply(reply.id, reply.user_id)}
                  title="Удаление ответа"
                  message="Вы уверены, что хотите удалить этот ответ? Это действие нельзя отменить."
                  confirmText="Удалить"
                  cancelText="Отмена"
                  isDanger={true}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {showAuthWarning && (
        <WarningMessage 
          variants={animationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <FiInfo />
          <span>Войдите, чтобы ответить на комментарий</span>
          <button onClick={() => setShowAuthWarning(false)}>Скрыть</button>
        </WarningMessage>
      )}
    </div>
  );
}

const LikeButton = styled(motion.button)`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
`;

const CommentSection = styled(motion.div)`
  overflow: hidden;
`;

// Helper function to determine if a color is dark/black
const isDarkColor = (hexColor) => {
  // Handle null or undefined
  if (!hexColor) return false;
  
  // Convert hex to RGB
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance - dark colors have low luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is dark (luminance < 0.5)
  return luminance < 0.5;
};

// Styled component for pinned status with improved visibility
const PinnedBadge = styled.div`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--accent, #1da1f2);
  gap: 5px;
  background-color: rgba(29, 161, 242, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  margin-left: 10px;
  font-weight: 500;
  
  svg {
    transform: rotate(45deg);
  }
  
  [data-theme="dark"] & {
    background-color: rgba(29, 161, 242, 0.35);
    color: #fff;
    box-shadow: 0 0 10px rgba(29, 161, 242, 0.4);
    border: 1px solid rgba(29, 161, 242, 0.5);
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
  }
`;

const PinButton = styled.button`
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

// Create a styled component for the pinned post with animated gradient border
const PinnedPostContainer = styled.div`
  position: relative;
  border-radius: 16px;
  margin-bottom: 20px; /* Добавляем отступ снизу, чтобы не прилипало к таймеру */
  
  /* Create an animated gradient border effect */
  &:before {
    content: '';
    position: absolute;
    inset: -3px; /* Увеличиваем толщину рамки */
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
    animation: gradientBorder 4s ease infinite;
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
  
  @keyframes gradientBorder {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

// Компонент для оптимизации изображений
const OptimizedImage = ({ src, alt, className, style }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  
  // Get optimized URL once using memoization
  const { displaySrc, originalSrc } = useMemo(() => {
    const optimized = getOptimizedUrl(src);
    return {
      displaySrc: optimized || src,
      originalSrc: src
    };
  }, [src]);
  
  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };
  
  // Handle image loading error
  const handleImageError = () => {
    // If optimized image failed and we haven't tried the original yet
    if (!useFallback && displaySrc !== originalSrc) {
      setUseFallback(true);
    } else {
      // Both optimized and original failed
      setIsLoading(false);
      setError(true);
    }
  };
  
  // Reset loading state on component unmount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return (
    <div className={className || ''} style={style}>
      {isLoading && <div className={styles.imageLoading}>Загрузка...</div>}
      {error && <div className={styles.imageError}>Ошибка загрузки</div>}
      {displaySrc && (
        <img 
          src={useFallback ? originalSrc : displaySrc} 
          alt={alt} 
          style={{ 
            display: isLoading ? 'none' : 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Add an EditPostForm component that will be shown when editing a post
const EditPostForm = ({ post, onSave, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [optimizedImageUrl, setOptimizedImageUrl] = useState('');
  const [imagePreviewLoading, setImagePreviewLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Update optimized image URL when image URL changes
  useEffect(() => {
    if (!imageUrl) {
      setOptimizedImageUrl('');
      setImagePreviewLoading(false);
      return;
    }
    
    setImagePreviewLoading(true);
    
    // Use the global optimization function with caching
    const optimized = getOptimizedUrl(imageUrl);
    setOptimizedImageUrl(optimized || imageUrl);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setImagePreviewLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [imageUrl]);
  
  // Handle image load events
  const handleImageLoad = () => {
    setImagePreviewLoading(false);
  };
  
  const handleImageError = () => {
    setImagePreviewLoading(false);
    setError('Ошибка загрузки изображения. Проверьте URL.');
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!content.trim()) {
      setError('Текст поста не может быть пустым');
      return;
    }
    
    const updatedPost = {
      title: title.trim() || null,
      content: content.trim(),
      imageUrl: imageUrl || null,
      // Also include image_url for backward compatibility
      image_url: imageUrl || null
    };
    
    onSave(updatedPost);
  };
  
  return (
    <div className={styles.editPostForm}>
      {error && (
        <div className={styles.errorMessage}>
          <FiAlertCircle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок поста"
          disabled={isSubmitting}
        />
        
        <textarea
          className={styles.contentInput}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Текст вашего поста..."
          rows={4}
          disabled={isSubmitting}
          required
        />
        
        <input
          type="text"
          className={styles.imageUrlInput}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL изображения (необязательно)"
          disabled={isSubmitting}
        />
        
        {imageUrl && (
          <div className={styles.imagePreview}>
            {imagePreviewLoading && <div className={styles.imageLoading}>Загрузка...</div>}
            <img 
              src={optimizedImageUrl || imageUrl} 
              alt="Предпросмотр" 
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                display: imagePreviewLoading ? 'none' : 'block',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
            <div className={styles.imageNote}>
              <FiImage /> Изображение будет автоматически оптимизировано
            </div>
          </div>
        )}
        
        <div className={styles.formOptions}>
          <button 
            type="button" 
            className={styles.cancelEditButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <FiX /> Отмена
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader /> Сохранение...
              </>
            ) : (
              <>
                <FiSend /> Сохранить
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Add a PollEditForm component that will be shown when editing a poll post
const PollEditForm = ({ post, onSave, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(post.title || '');
  const [question, setQuestion] = useState(post.poll_data?.question || '');
  const [options, setOptions] = useState(post.poll_data?.options || ['', '']);
  const [error, setError] = useState('');
  
  // Use the title as question if no separate question is provided
  useEffect(() => {
    if (question === '' && title !== '') {
      setQuestion(title);
    }
  }, [title, question]);
  
  // Handle adding a new poll option
  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };
  
  // Handle removing a poll option
  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };
  
  // Handle option text change
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!title.trim() && !question.trim()) {
      setError('Заголовок или вопрос опроса не может быть пустым');
      return;
    }
    
    // Validate options: need at least 2 non-empty options
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Требуется минимум два варианта ответа для опроса');
      return;
    }
    
    // Create updated poll data
    const pollData = {
      question: question.trim() || title.trim(),
      options: options.filter(opt => opt.trim() !== '')
    };
    
    // Create the updated post object
    const updatedPost = {
      title: title.trim(),
      content: post.content || '',
      poll: pollData
    };
    
    onSave(updatedPost);
  };
  
  return (
    <div className={styles.editPostForm}>
      {error && (
        <div className={styles.errorMessage}>
          <FiAlertCircle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок опроса"
          disabled={isSubmitting}
        />
        
        <div className={styles.pollContainer}>
          <input
            type="text"
            className={styles.pollQuestionInput}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Вопрос опроса (если отличается от заголовка)"
            disabled={isSubmitting}
          />
          
          <div className={styles.pollOptions}>
            {options.map((option, index) => (
              <div key={index} className={styles.pollOptionInputWrapper}>
                <input
                  type="text"
                  className={styles.pollOptionInput}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Вариант ${index + 1}`}
                  disabled={isSubmitting}
                  required={index < 2}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className={styles.removeOptionButton}
                    onClick={() => handleRemoveOption(index)}
                    disabled={isSubmitting}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {options.length < 10 && (
            <button
              type="button"
              className={styles.addOptionButton}
              onClick={handleAddOption}
              disabled={isSubmitting}
            >
              <FiPlus /> Добавить вариант
            </button>
          )}
        </div>
        
        <div className={styles.formOptions}>
          <button 
            type="button" 
            className={styles.cancelEditButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <FiX /> Отмена
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader /> Сохранение...
              </>
            ) : (
              <>
                <FiSend /> Сохранить
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const PostItem = ({ post, onLikeToggle, fullView = false, onDelete, onPinChange, onUpdate }) => {
  const { user, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(fullView);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState('');
  const [isPinned, setIsPinned] = useState(post.is_pinned || false);
  const [isPinning, setIsPinning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  
  // Новое состояние для отслеживания прямых комментариев и общего количества
  const [directCommentsCount, setDirectCommentsCount] = useState(0);
  
  // Poll states
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOption, setVotedOption] = useState(null);
  const [pollResults, setPollResults] = useState([]);
  
  // Проверяем, отображать ли заголовок и содержимое отдельно
  const hasTitle = post.title && post.title.trim().length > 0;
  
  // Проверяем, является ли пользователь администратором
  const isAdmin = user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // Check if post has styling
  const styling = post.styling || {};
  const titleColor = styling.titleColor || '#000000';
  const contentColor = styling.contentColor || '#000000';
  const fontFamily = styling.fontFamily || 'inherit';
  
  // Determine if colors are dark and need conversion in dark theme
  const isTitleDark = isDarkColor(titleColor);
  const isContentDark = isDarkColor(contentColor);
  
  // Определяем, является ли устройство мобильным
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Отслеживаем изменение размера экрана
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Обновляем относительное время каждую минуту
  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(formatRelativeTime(post.created_at, isMobile));
    };
    
    // Инициализируем время
    updateTime();
    
    // Запускаем интервал для обновления времени
    const intervalId = setInterval(updateTime, 60000); // каждую минуту
    
    return () => clearInterval(intervalId);
  }, [post.created_at, isMobile]);
  
  // Проверяем, лайкнул ли пользователь пост
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (isAuthenticated && user) {
        try {
          const { liked } = await postService.isLikedByUser(post.id, user.id);
          setIsLiked(liked);
        } catch (error) {
          console.error('Ошибка при проверке статуса лайка:', error);
        }
      }
    };
    
    checkLikeStatus();
  }, [post.id, user, isAuthenticated]);
  
  // Проверяем, голосовал ли пользователь в опросе
  useEffect(() => {
    const checkPollVoteStatus = async () => {
      if (post.poll_data && isAuthenticated && user) {
        try {
          const { hasVoted, option, results } = await postService.getPollVoteStatus(post.id, user.id);
          setHasVoted(hasVoted);
          setVotedOption(option);
          setPollResults(results);
        } catch (error) {
          console.error('Ошибка при проверке статуса голосования:', error);
          // В случае ошибки 406 (Not Acceptable) или другой ошибки показываем стандартные результаты
          try {
            // Пытаемся получить хотя бы общие результаты
            const { results } = await postService.getPollResults(post.id);
            setPollResults(results);
          } catch (secondError) {
            console.error('Не удалось получить даже базовые результаты опроса:', secondError);
            // Создаем фиктивные результаты, если вообще не можем получить данные
            if (post.poll_data && post.poll_data.options) {
              const fakeResults = post.poll_data.options.map((option) => ({
                option,
                votes: 0
              }));
              setPollResults(fakeResults);
            }
          }
        }
      } else if (post.poll_data) {
        // Для неавторизованных пользователей показываем только результаты
        try {
          const { results } = await postService.getPollResults(post.id);
          setPollResults(results);
        } catch (error) {
          console.error('Ошибка при получении результатов опроса:', error);
          // Создаем фиктивные результаты в случае ошибки
          if (post.poll_data && post.poll_data.options) {
            const fakeResults = post.poll_data.options.map((option) => ({
              option,
              votes: 0
            }));
            setPollResults(fakeResults);
          }
        }
      }
    };
    
    if (post.poll_data) {
      checkPollVoteStatus();
    }
  }, [post.id, post.poll_data, user, isAuthenticated]);
  
  // Обновляем состояние лайков из пропсов
  useEffect(() => {
    setLikesCount(post.likes_count || 0);
  }, [post.likes_count]);
  
  // Обновляем количество комментариев из пропсов
  useEffect(() => {
    setCommentsCount(post.comments_count || 0);
  }, [post.comments_count]);
  
  // Функция для загрузки комментариев
  const loadComments = async () => {
    if (comments.length > 0 && !showComments) {
      // Если комментарии уже загружены, просто показываем их
      setShowComments(true);
      setIsLoadingComments(false); // Важно: убедимся, что состояние загрузки сброшено
      return;
    }
    
    try {
      setIsLoadingComments(true);
      console.log('Loading comments for post:', post.id);
      const commentsList = await commentService.getCommentsByPostId(post.id);
      console.log('Comments loaded:', commentsList.length);
      
      // Подсчитываем общее количество включая ответы
      let repliesCount = 0;
      commentsList.forEach(comment => {
        if (comment.replies) {
          repliesCount += comment.replies.length;
        }
      });
      
      // Сохраняем количество прямых комментариев
      setDirectCommentsCount(commentsList.length);
      
      // Сохраняем общее количество комментариев (прямые + ответы)
      const totalCount = commentsList.length + repliesCount;
      setCommentsCount(totalCount);
      
      setComments(commentsList);
      setShowComments(true);
    } catch (error) {
      console.error('Ошибка при загрузке комментариев:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  // Обработчик лайка
  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      setShowAuthWarning('like');
      return;
    }
    
    try {
      // Оптимистичное обновление UI
      const newLikedState = !isLiked;
      const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
      
      setIsLiked(newLikedState);
      setLikesCount(newLikesCount > 0 ? newLikesCount : 0); // Предотвращаем отрицательное число
      
      // Анимация лайка
      const likeButton = document.querySelector(`#like-${post.id}`);
      if (likeButton) {
        likeButton.classList.add(styles.likeAnimation);
        setTimeout(() => {
          likeButton.classList.remove(styles.likeAnimation);
        }, 1000);
      }
      
      // Отправка запроса на сервер
      const result = await postService.toggleLike(post.id, user.id);
      
      // Обновляем состояние с реальными данными с сервера
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      
      // Вызываем обратный вызов для обновления списка постов
      if (onLikeToggle) {
        onLikeToggle(post.id, result.liked, result.likesCount);
      }
    } catch (error) {
      console.error('Ошибка при обновлении лайка:', error);
      
      // В случае ошибки возвращаемся к исходному состоянию
      setIsLiked(!isLiked);
      const resetLikesCount = isLiked ? likesCount + 1 : likesCount - 1;
      setLikesCount(resetLikesCount > 0 ? resetLikesCount : 0);
    }
  };
  
  // Переключение отображения комментариев
  const toggleComments = () => {
    if (showComments) {
      setShowComments(false);
    } else {
      // Always set loading state to true before fetching
      setIsLoadingComments(true);
      loadComments();
    }
  };
  
  // Обработчик голосования в опросе
  const handlePollVote = async (optionIndex) => {
    if (!isAuthenticated) {
      setShowAuthWarning('poll');
      return;
    }
    
    try {
      // Fix the function name - votePoll instead of voteInPoll
      const response = await postService.votePoll(post.id, optionIndex);
      
      if (response.success) {
        setHasVoted(true);
        setVotedOption(optionIndex);
        setPollResults(response.results);
      } else {
        throw new Error(response.message || 'Ошибка при голосовании');
      }
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      
      // Show proper error message to user
      alert(`Не удалось проголосовать: ${error.message || 'Неизвестная ошибка'}`);
      
      // In case of error, try to provide fallback UI update
      if (post.poll_data && post.poll_data.options) {
        // Create fake results with one vote for debug purposes
        const fakeResults = post.poll_data.options.map((option, index) => ({
          option,
          votes: index === optionIndex ? 1 : 0
        }));
        
        // Only in development - update UI even after error
        if (process.env.NODE_ENV === 'development') {
          setHasVoted(true);
          setVotedOption(optionIndex);
          setPollResults(fakeResults);
          console.log('Development mode: Showing fake poll results after error');
        }
      }
    }
  };
  
  // Отправка нового комментария
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setCommentError('Войдите, чтобы оставить комментарий');
      return;
    }
    
    if (!newComment.trim()) {
      setCommentError('Комментарий не может быть пустым');
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      setCommentError('');
      
      // Применяем фильтр нецензурных слов к тексту комментария, передавая объект пользователя
      const filteredContent = filterBadWords(newComment, user);
      
      const createdComment = await commentService.createComment({
        content: filteredContent,
        postId: post.id,
        userId: user.id
      });
      
      // Обновляем список комментариев - добавляем новый комментарий в начало списка
      setComments([createdComment, ...comments]);
      
      // Увеличиваем количество прямых комментариев
      setDirectCommentsCount(prevCount => prevCount + 1);
      
      // Увеличиваем общее количество комментариев
      setCommentsCount(prevCount => prevCount + 1);
      
      // Очищаем форму
      setNewComment('');
    } catch (error) {
      console.error('Ошибка при создании комментария:', error);
      setCommentError('Не удалось отправить комментарий');
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Отправка ответа на комментарий
  const handleReplyToComment = async (commentId, content) => {
    if (!isAuthenticated) {
      setShowAuthWarning('reply');
      return;
    }
    
    try {
      // Применяем фильтр нецензурных слов к тексту ответа
      const filteredContent = filterBadWords(content, user);
      
      const reply = await commentService.replyToComment({
        content: filteredContent,
        commentId,
        postId: post.id,
        userId: user.id
      });
      
      // Обновляем список комментариев с ответом
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          const replies = comment.replies || [];
          return {
            ...comment,
            replies: [...replies, reply]
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      // Увеличиваем счетчик комментариев (общий счетчик, включая ответы)
      setCommentsCount(prevCount => prevCount + 1);
      
      return reply;
    } catch (error) {
      console.error('Ошибка при ответе на комментарий:', error);
      throw error;
    }
  };
  
  // Обработчик удаления поста (только для администраторов)
  const openDeleteConfirm = () => {
    // Проверяем, является ли пользователь администратором
    const isAdmin = isAuthenticated && user && (
      user.email === 'igoraor79@gmail.com' || 
      user.perks?.includes('admin') || 
      user.activePerk === 'admin'
    );
    
    if (!isAdmin) {
      alert('Только администраторы могут удалять посты');
      return;
    }
    
    setShowDeleteConfirm(true);
  };
  
  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };
  
  const handleDeletePost = async () => {
    // Проверяем, является ли пользователь администратором
    const isAdmin = isAuthenticated && user && (
      user.email === 'igoraor79@gmail.com' || 
      user.perks?.includes('admin') || 
      user.activePerk === 'admin'
    );
    
    if (!isAdmin) {
      alert('Только администраторы могут удалять посты');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const result = await postService.deletePost(post.id);
      
      if (result.success) {
        // Вызываем колбэк для удаления поста из списка
        if (onDelete) {
          onDelete(post.id);
        }
        
        setShowDeleteConfirm(false);
      } else {
        throw new Error('Не удалось удалить пост');
      }
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
      alert('Не удалось удалить пост: ' + (error.message || 'Попробуйте позже.'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle comment deletion
  const handleCommentDeleted = (commentId) => {
    // First check if it's a direct comment
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1) {
      // Получаем количество ответов для этого комментария
      const repliesCount = comments[commentIndex].replies?.length || 0;
      
      // It's a direct comment, remove it from the list
      setComments(comments.filter(comment => comment.id !== commentId));
      
      // Decrease the direct comments count
      setDirectCommentsCount(prevCount => prevCount - 1);
      
      // Decrease the total comments count including replies
      setCommentsCount(prevCount => prevCount - (1 + repliesCount));
    } else {
      // It might be a reply, so check all comments for this reply
      const updatedComments = comments.map(comment => {
        // If this comment has the reply we're looking for
        if (comment.replies && comment.replies.some(reply => reply.id === commentId)) {
          // Filter out the deleted reply
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== commentId)
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      // Decrease the comments count for a reply
      setCommentsCount(prevCount => prevCount - 1);
    }
  };
  
  // Update the pin status when the prop changes
  useEffect(() => {
    setIsPinned(post.is_pinned || false);
  }, [post.is_pinned]);
  
  // Функция для закрепления/открепления поста
  const handleTogglePin = async () => {
    if (!isAdmin) return;
    
    try {
      setIsPinning(true);
      
      if (isPinned) {
        // Открепляем пост
        const result = await postService.unpinPost(post.id);
        if (result.success) {
          setIsPinned(false);
          
          // Вызываем колбэк для обновления списка постов
          if (onPinChange) {
            onPinChange(post.id, false);
          }
        }
      } else {
        // Закрепляем пост
        const result = await postService.pinPost(post.id);
        if (result.success) {
          setIsPinned(true);
          
          // Вызываем колбэк для обновления списка постов
          if (onPinChange) {
            onPinChange(post.id, true);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса закрепления:', error);
      alert('Не удалось изменить статус закрепления: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsPinning(false);
    }
  };
  
  // Добавляем слушатель изменения темы для обновления отображения компонента
  useEffect(() => {
    const handleThemeChange = () => {
      // Форсируем обновление компонента при изменении темы
      setTimeAgo(formatRelativeTime(post.created_at, isMobile));
    };
    
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, [post.created_at, isMobile]);
  
  // Функция для обработки редактирования поста
  const handleEditPost = async (updatedPost) => {
    if (!isAdmin) return;
    
    try {
      setIsSubmittingEdit(true);
      
      console.log('Updating post with data:', updatedPost);
      
      // Call the update function passed from the parent
      const result = await postService.updatePost(post.id, updatedPost);
      
      if (result && result.success) {
        console.log('Post updated successfully:', result.post);
        
        // Update local post data with the response
        if (onUpdate) {
          onUpdate(result.post);
        }
        
        setIsEditing(false);
      } else {
        throw new Error('Не удалось обновить пост');
      }
    } catch (error) {
      console.error('Ошибка при обновлении поста:', error);
      alert('Не удалось обновить пост: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };
  
  // Function to toggle edit mode
  const toggleEditMode = () => {
    if (!isAdmin) return;
    setIsEditing(!isEditing);
  };
  
  // Check if post is a poll post
  const isPollPost = !!post.poll_data;
  
  // State to track if poll has votes (used to determine if poll is editable)
  const [pollHasVotes, setPollHasVotes] = useState(false);
  
  // Check if poll has votes when component mounts
  useEffect(() => {
    const checkPollVotes = async () => {
      if (isPollPost) {
        try {
          const { results } = await postService.getPollResults(post.id);
          // Check if any option has votes
          const hasVotes = results.some(result => result.votes > 0);
          setPollHasVotes(hasVotes);
        } catch (error) {
          console.error('Error checking poll votes:', error);
        }
      }
    };
    
    if (isPollPost) {
      checkPollVotes();
    }
  }, [post.id, isPollPost]);

  return (
    <>
      {isPinned ? (
        <PinnedPostContainer>
          <div className={styles.postItem}>
            {/* If in edit mode, show edit form, otherwise show post content */}
            {isEditing ? (
              <EditPostForm 
                post={post}
                onSave={handleEditPost}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmittingEdit}
              />
            ) : (
              <>
                <div className={styles.postHeader}>
                  <Link to={`/profile/${post.user_id}`} className={styles.authorInfo}>
                    <OptimizedAvatar src={post.author.avatar} alt={post.author.displayName} className={styles.avatar} />
                    <span 
                      className={
                        post.author.activePerk === 'early_user' 
                          ? perkStyles.earlyUserPerk
                          : post.author.activePerk === 'sponsor' 
                          ? perkStyles.sponsorPerk
                          : post.author.activePerk === 'admin' 
                          ? perkStyles.adminPerk
                          : perkStyles.userPerk
                      }
                      style={{
                        display: 'inline-block',
                        margin: 0,
                        padding: 0
                      }}
                    >
                      {post.author.displayName}
                    </span>
                  </Link>
                  <div className={styles.postMeta}>
                    {isPinned && (
                      <PinnedBadge>
                        <AiOutlinePushpin /> Закреплено
                      </PinnedBadge>
                    )}
                    <span className={styles.postDate}>
                      <FiClock /> {timeAgo}
                    </span>
                  </div>
                </div>
                
                {/* Заголовок поста - новый элемент */}
                {hasTitle && (
                  <h2 
                    className={styles.postTitle}
                    style={{ 
                      color: titleColor, 
                      fontFamily: fontFamily 
                    }}
                  >
                    <span className={isTitleDark ? styles.darkTextConversion : ''}>
                      {post.title}
                    </span>
                  </h2>
                )}
                
                <div 
                  className={styles.postContent}
                  style={{ 
                    color: contentColor, 
                    fontFamily: fontFamily 
                  }}
                >
                  <span className={isContentDark ? styles.darkTextConversion : ''}>
                    {post.content}
                  </span>
                </div>
                
                {post.image_url && (
                  <div className={styles.postImage}>
                    <OptimizedImage src={post.image_url} alt="Изображение к посту" className={styles.postImage} style={{ display: 'block' }} />
                  </div>
                )}
                
                {post.poll_data && (
                  <div className={styles.pollContainer}>
                    <PollComponent 
                      poll={{
                        ...post.poll_data,
                        hideQuestion: post.title && post.poll_data.question === post.title
                      }}
                      postId={post.id}
                      onVote={handlePollVote}
                      hasVoted={hasVoted}
                      votedOption={votedOption}
                      results={pollResults}
                      isAdmin={isAdmin}
                      user={user}
                    />
                  </div>
                )}
              </>
            )}
            
            {/* Only show actions if not in edit mode */}
            {!isEditing && (
              <div className={styles.postActions}>
                <div className={styles.actionButtons}>
                  <button 
                    id={`like-${post.id}`}
                    className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                    onClick={handleLikeClick}
                  >
                    <FiHeart /> <span className={styles.likeCount}>{likesCount}</span>
                  </button>
                  
                  <button 
                    className={styles.commentButton}
                    onClick={toggleComments}
                  >
                    <FiMessageSquare /> <span>{commentsCount}</span>
                  </button>
                  
                  {isAuthenticated && isAdmin && (
                    <PinButton
                      onClick={handleTogglePin}
                      disabled={isPinning}
                      $isPinned={isPinned}
                    >
                      <AiOutlinePushpin /> {isPinned ? "Открепить" : "Закрепить"}
                    </PinButton>
                  )}
                </div>
                
                {isAuthenticated && isAdmin && (
                  <div className={styles.adminActions}>
                    {/* Add edit button for regular posts */}
                    {!isPollPost && (
                      <button 
                        className={styles.editButton}
                        onClick={toggleEditMode}
                        disabled={isEditing}
                      >
                        <FiEdit /> Изменить
                      </button>
                    )}
                    <button 
                      className={styles.deleteButton}
                      onClick={openDeleteConfirm}
                      disabled={isDeleting}
                    >
                      <FiTrash2 /> {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Post Delete confirmation dialog */}
            <ConfirmDialog
              isOpen={showDeleteConfirm}
              onClose={closeDeleteConfirm}
              onConfirm={handleDeletePost}
              title="Удаление поста"
              message="Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить."
              confirmText="Удалить"
              cancelText="Отмена"
              isDanger={true}
            />
            
            <AnimatePresence>
            {showComments && (
                <CommentSection
                  variants={commentSectionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
              <div className={styles.commentsSection}>
                <h4 className={styles.commentsHeading}>
                  <FiMessageCircle /> Комментарии ({commentsCount})
                </h4>
                
                {isLoadingComments ? (
                  <div className={styles.loadingComments}>
                    <FiLoader /> Загрузка комментариев...
                  </div>
                ) : (
                  <>
                    {comments && comments.length > 0 ? (
                      <div className={styles.commentsList}>
                        {comments.map(comment => (
                          <CommentItem 
                            key={comment.id} 
                            comment={comment}
                            onReply={handleReplyToComment}
                            onDelete={handleCommentDeleted}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={styles.noComments}>
                        Комментариев пока нет. Будьте первым!
                      </div>
                    )}
                    
                    {isAuthenticated && (
                      <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                        {commentError && (
                          <div className={styles.errorMessage}>
                            <FiAlertCircle /> {commentError}
                          </div>
                        )}
                        
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Напишите комментарий..."
                          disabled={isSubmittingComment}
                        />
                        
                        <button type="submit" disabled={isSubmittingComment}>
                          {isSubmittingComment ? (
                            <>
                              <FiLoader /> Отправка...
                            </>
                          ) : (
                            <>
                              <FiSend /> Отправить
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
                </CommentSection>
            )}
            </AnimatePresence>
            
            {showAuthWarning && (
              <WarningMessage 
                variants={animationVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <FiInfo />
                <span>
                  {showAuthWarning === 'like' && 'Войдите, чтобы поставить лайк'}
                  {showAuthWarning === 'poll' && 'Войдите, чтобы проголосовать'}
                  {showAuthWarning === 'reply' && 'Войдите, чтобы ответить на комментарий'}
                </span>
                <button onClick={() => setShowAuthWarning('')}>Скрыть</button>
              </WarningMessage>
            )}
          </div>
        </PinnedPostContainer>
      ) : (
        <div className={styles.postItem}>
          {/* If in edit mode, show appropriate edit form based on post type */}
          {isEditing ? (
            isPollPost ? (
              <PollEditForm 
                post={post}
                onSave={handleEditPost}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmittingEdit}
              />
            ) : (
              <EditPostForm 
                post={post}
                onSave={handleEditPost}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmittingEdit}
              />
            )
          ) : (
            <>
              <div className={styles.postHeader}>
                <Link to={`/profile/${post.user_id}`} className={styles.authorInfo}>
                  <OptimizedAvatar src={post.author.avatar} alt={post.author.displayName} className={styles.avatar} />
                  <span 
                    className={
                      post.author.activePerk === 'early_user' 
                        ? perkStyles.earlyUserPerk
                        : post.author.activePerk === 'sponsor' 
                        ? perkStyles.sponsorPerk
                        : post.author.activePerk === 'admin' 
                        ? perkStyles.adminPerk
                        : perkStyles.userPerk
                    }
                    style={{
                      display: 'inline-block',
                      margin: 0,
                      padding: 0
                    }}
                  >
                    {post.author.displayName}
                  </span>
                </Link>
                <div className={styles.postMeta}>
                  {isPinned && (
                    <PinnedBadge>
                      <AiOutlinePushpin /> Закреплено
                    </PinnedBadge>
                  )}
                  <span className={styles.postDate}>
                    <FiClock /> {timeAgo}
                  </span>
                </div>
              </div>
              
              {/* Заголовок поста - новый элемент */}
              {hasTitle && (
                <h2 
                  className={styles.postTitle}
                  style={{ 
                    color: titleColor, 
                    fontFamily: fontFamily 
                  }}
                >
                  <span className={isTitleDark ? styles.darkTextConversion : ''}>
                    {post.title}
                  </span>
                </h2>
              )}
              
              <div 
                className={styles.postContent}
                style={{ 
                  color: contentColor, 
                  fontFamily: fontFamily 
                }}
              >
                <span className={isContentDark ? styles.darkTextConversion : ''}>
                  {post.content}
                </span>
              </div>
              
              {post.image_url && (
                <div className={styles.postImage}>
                  <OptimizedImage src={post.image_url} alt="Изображение к посту" className={styles.postImage} style={{ display: 'block' }} />
                </div>
              )}
              
              {post.poll_data && (
                <div className={styles.pollContainer}>
                  <PollComponent 
                    poll={{
                      ...post.poll_data,
                      hideQuestion: post.title && post.poll_data.question === post.title
                    }}
                    postId={post.id}
                    onVote={handlePollVote}
                    hasVoted={hasVoted}
                    votedOption={votedOption}
                    results={pollResults}
                    isAdmin={isAdmin}
                    user={user}
                  />
                </div>
              )}
            </>
          )}
          
          {/* Only show actions if not in edit mode */}
          {!isEditing && (
            <div className={styles.postActions}>
              <div className={styles.actionButtons}>
                <button 
                  id={`like-${post.id}`}
                  className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                  onClick={handleLikeClick}
                >
                  <FiHeart /> <span className={styles.likeCount}>{likesCount}</span>
                </button>
                
                <button 
                  className={styles.commentButton}
                  onClick={toggleComments}
                >
                  <FiMessageSquare /> <span>{commentsCount}</span>
                </button>
                
                {isAuthenticated && isAdmin && (
                  <PinButton
                    onClick={handleTogglePin}
                    disabled={isPinning}
                    $isPinned={isPinned}
                  >
                    <AiOutlinePushpin /> {isPinned ? "Открепить" : "Закрепить"}
                  </PinButton>
                )}
              </div>
              
              {isAuthenticated && isAdmin && (
                <div className={styles.adminActions}>
                  {/* Display edit button for regular posts */}
                  {!isPollPost && (
                    <button 
                      className={styles.editButton}
                      onClick={toggleEditMode}
                      disabled={isEditing}
                    >
                      <FiEdit /> Изменить
                    </button>
                  )}
                  <button 
                    className={styles.deleteButton}
                    onClick={openDeleteConfirm}
                    disabled={isDeleting}
                  >
                    <FiTrash2 /> {isDeleting ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Post Delete confirmation dialog */}
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={closeDeleteConfirm}
            onConfirm={handleDeletePost}
            title="Удаление поста"
            message="Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить."
            confirmText="Удалить"
            cancelText="Отмена"
            isDanger={true}
          />
          
          <AnimatePresence>
          {showComments && (
              <CommentSection
                variants={commentSectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
            <div className={styles.commentsSection}>
              <h4 className={styles.commentsHeading}>
                <FiMessageCircle /> Комментарии ({commentsCount})
              </h4>
              
              {isLoadingComments ? (
                <div className={styles.loadingComments}>
                  <FiLoader /> Загрузка комментариев...
                </div>
              ) : (
                <>
                  {comments && comments.length > 0 ? (
                    <div className={styles.commentsList}>
                      {comments.map(comment => (
                        <CommentItem 
                          key={comment.id} 
                          comment={comment}
                          onReply={handleReplyToComment}
                          onDelete={handleCommentDeleted}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noComments}>
                      Комментариев пока нет. Будьте первым!
                    </div>
                  )}
                  
                  {isAuthenticated && (
                    <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                      {commentError && (
                        <div className={styles.errorMessage}>
                          <FiAlertCircle /> {commentError}
                        </div>
                      )}
                      
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Напишите комментарий..."
                        disabled={isSubmittingComment}
                      />
                      
                      <button type="submit" disabled={isSubmittingComment}>
                        {isSubmittingComment ? (
                          <>
                            <FiLoader /> Отправка...
                          </>
                        ) : (
                          <>
                            <FiSend /> Отправить
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
              </CommentSection>
          )}
          </AnimatePresence>
          
          {showAuthWarning && (
            <WarningMessage 
              variants={animationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <FiInfo />
              <span>
                {showAuthWarning === 'like' && 'Войдите, чтобы поставить лайк'}
                {showAuthWarning === 'poll' && 'Войдите, чтобы проголосовать'}
                {showAuthWarning === 'reply' && 'Войдите, чтобы ответить на комментарий'}
              </span>
              <button onClick={() => setShowAuthWarning('')}>Скрыть</button>
            </WarningMessage>
          )}
        </div>
      )}
    </>
  );
};

// Явный экспорт компонента PostItem
export default PostItem; 