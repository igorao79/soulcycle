import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Современный хук для отслеживания направления скролла и позиции
 * @param {number} threshold - Минимальная позиция скролла для активации sticky состояния
 * @param {number} throttleMs - Время throttle для оптимизации производительности
 * @returns {Object} - Объект с данными о скролле
 */
export const useScrollDirection = (threshold = 100, throttleMs = 16) => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollTimeout = useRef(null);

  // Throttled scroll handler для оптимизации производительности
  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Определяем направление скролла
    if (Math.abs(currentScrollY - lastScrollY.current) < 5) {
      ticking.current = false;
      return; // Игнорируем микро-движения
    }

    const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
    
    setScrollDirection(direction);
    setScrollY(currentScrollY);
    setIsScrolled(currentScrollY > threshold);
    setIsScrolling(true);
    
    lastScrollY.current = currentScrollY;
    ticking.current = false;

    // Сбрасываем состояние скроллинга после паузы
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [threshold]);

  // Оптимизированный обработчик скролла с requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  useEffect(() => {
    // Устанавливаем начальные значения
    setScrollY(window.scrollY);
    setIsScrolled(window.scrollY > threshold);
    lastScrollY.current = window.scrollY;

    // Добавляем обработчик скролла
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout.current);
    };
  }, [handleScroll, threshold]);

  return {
    scrollDirection,
    scrollY,
    isScrolled,
    isScrolling,
    isScrollingUp: scrollDirection === 'up',
    isScrollingDown: scrollDirection === 'down'
  };
};

export default useScrollDirection; 