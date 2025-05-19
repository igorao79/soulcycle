import React, { useState, useEffect, useMemo } from 'react';
import { FiInfo } from 'react-icons/fi';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  PollWrapper, PollQuestion, PollOptionsList, PollOption, PollOptionButton,
  OptionText, CheckIcon, PercentageText, ProgressBarContainer, ProgressBarFill,
  VotesCount, BarChartIcon
} from '../styles/PollStyles';
import { AdminViewBadge, WarningMessage, animationVariants } from '../styles/PostStyles';
import { declOfNum } from '../utils/helpers';
import Notification from '../../../common/Notification';

const PollComponent = ({ poll, postId, onVote, hasVoted, votedOption, results, isAdmin, user }) => {
  const { isAuthenticated } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [authError, setAuthError] = useState(false);
  
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
    
    return finalPercentages;
  }, [results, totalVotes, poll.options.length]);

  const handleVote = async (optionIndex) => {
    if (!isAuthenticated) {
      setAuthError(true);
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
      
      {authError && (
        <Notification
          type="info"
          message="Войдите, чтобы проголосовать"
          show={!!authError}
          onClose={() => setAuthError(false)}
        />
      )}
      
      <VotesCount>
        {isAdmin && !hasVoted && (
          <AdminViewBadge>Просмотр администратора</AdminViewBadge>
        )}
        <BarChartIcon />
        {totalVotes} {declOfNum(totalVotes, ['голос', 'голоса', 'голосов'])}
      </VotesCount>
    </PollWrapper>
  );
};

export default PollComponent; 