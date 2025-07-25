import { useState, useEffect } from 'react';

/**
 * Кастомный хук для работы с реальной высотой viewport на мобильных устройствах
 * Решает проблемы с 100vh в iOS Safari и других мобильных браузерах
 */
export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 1024
  );
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      setViewportHeight(height);
      setViewportWidth(width);
      
      // Устанавливаем CSS custom properties
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--viewport-width', `${width}px`);
    };

    // Обновляем сразу
    updateViewport();

    // Обработчики событий
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    
    // Для iOS - дополнительная проверка через небольшую задержку
    const orientationChangeHandler = () => {
      setTimeout(updateViewport, 100);
      setTimeout(updateViewport, 500);
    };
    
    window.addEventListener('orientationchange', orientationChangeHandler);

    // Очистка
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.removeEventListener('orientationchange', orientationChangeHandler);
    };
  }, []);

  return {
    viewportHeight,
    viewportWidth,
    isMobile: viewportWidth <= 768,
    isLandscape: viewportWidth > viewportHeight
  };
};

/**
 * Хук для получения безопасной высоты (учитывает bottom safe area)
 */
export const useSafeViewportHeight = () => {
  const { viewportHeight } = useMobileViewport();
  const [safeHeight, setSafeHeight] = useState(viewportHeight);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Проверяем поддержку env() и safe area
    const checkSafeArea = () => {
      const testElement = document.createElement('div');
      testElement.style.paddingBottom = 'env(safe-area-inset-bottom)';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const safeAreaBottom = parseFloat(computedStyle.paddingBottom) || 0;
      
      document.body.removeChild(testElement);
      
      setSafeHeight(viewportHeight - safeAreaBottom);
    };

    checkSafeArea();
  }, [viewportHeight]);

  return safeHeight;
};

export default useMobileViewport; 