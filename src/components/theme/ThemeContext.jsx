import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';

export const ThemeContext = createContext();

const themes = {
  light: {
    '--primary-color': '#000000',
    '--background-color': '#ffffff',
    '--text-color': '#000000',
    '--secondary-color': '#666666',
    '--accent-color': '#3498db',
  },
  dark: {
    '--primary-color': '#ffffff',
    '--background-color': '#1a1a1a',
    '--text-color': '#ffffff',
    '--secondary-color': '#999999',
    '--accent-color': '#3498db',
  }
};

// Helper function to check if a color is dark
const isDarkColor = (color) => {
  // For hex colors
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calculate luminance - colors with luminance < 0.5 are considered dark
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  }
  // For rgb/rgba colors
  if (color.startsWith('rgb')) {
    const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
    }
  }
  return false;
};

export const ThemeProvider = ({ children }) => {
  // Немедленно применяем сохраненную тему при загрузке страницы
  // это происходит до первого рендера компонента
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const [theme, setTheme] = useState(savedTheme);

  // Улучшенное применение CSS-переменных при изменении темы
  const applyTheme = useCallback((themeName) => {
    const themeVariables = themes[themeName];
    
    // Сначала устанавливаем атрибут data-theme
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Применяем переменные темы
    if (themeName === 'dark') {
      // Принудительно применяем все переменные темной темы
      Object.entries(themeVariables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
      
      // Дополнительно проверяем и применяем цвета фона и границ для обеспечения
      // правильного отображения в темной теме
      document.documentElement.style.setProperty('--background-color', '#1e1e1e');
      document.documentElement.style.setProperty('--text-color', '#e0e0e0');
      document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
      document.documentElement.style.setProperty('--bg-secondary', '#292929');
    } else {
      // Для светлой темы применяем все переменные нормально
      Object.entries(themeVariables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
  }, []);

  // Улучшенный обработчик переключения темы с полным сбросом стилей
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Сначала применяем тему визуально
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Затем сохраняем в localStorage
    localStorage.setItem('theme', newTheme);
    
    // Принудительно сбрасываем все inline стили для корректного переключения
    const styleProps = getComputedStyle(document.documentElement);
    for (let i = 0; i < styleProps.length; i++) {
      const prop = styleProps[i];
      if (prop.startsWith('--')) {
        document.documentElement.style.removeProperty(prop);
      }
    }
    
    // Применяем весь набор стилей для новой темы
    const themeVariables = themes[newTheme];
    if (themeVariables) {
      Object.entries(themeVariables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
    
    // Применяем дополнительные важные стили в зависимости от темы
    if (newTheme === 'dark') {
      // Принудительно применяем критичные стили для темной темы
      document.documentElement.style.setProperty('--background-color', '#1e1e1e');
      document.documentElement.style.setProperty('--text-color', '#e0e0e0');
      document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
      document.documentElement.style.setProperty('--bg-secondary', '#292929');
      document.documentElement.style.setProperty('--bg-highlight', '#2a2a2a');
      document.documentElement.style.setProperty('--modal-bg', '#2a2a2a');
    } else {
      // Принудительно применяем критичные стили для светлой темы
      document.documentElement.style.setProperty('--background-color', '#fff');
      document.documentElement.style.setProperty('--text-color', '#000');
      document.documentElement.style.setProperty('--text-primary', '#222222');
      document.documentElement.style.setProperty('--bg-secondary', '#f8f9fa');
      document.documentElement.style.setProperty('--bg-highlight', '#f5f8fa');
      document.documentElement.style.setProperty('--modal-bg', '#ffffff');
    }
    
    // В последнюю очередь обновляем состояние React
    setTheme(newTheme);
    
    // Принудительно запускаем событие обновления темы для компонентов
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  }, [theme]);

  // Улучшенная инициализация темы при первом рендере с полной очисткой стилей
  useEffect(() => {
    // Сначала устанавливаем атрибут темы
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Принудительно сбрасываем все inline стили
    const styleProps = getComputedStyle(document.documentElement);
    for (let i = 0; i < styleProps.length; i++) {
      const prop = styleProps[i];
      if (prop.startsWith('--')) {
        document.documentElement.style.removeProperty(prop);
      }
    }
    
    // Применяем весь набор стилей для темы
    const themeVariables = themes[savedTheme];
    if (themeVariables) {
      Object.entries(themeVariables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
    
    // Применяем дополнительные важные стили зависящие от темы
    if (savedTheme === 'dark') {
      // Принудительно применяем критичные стили для темной темы
      document.documentElement.style.setProperty('--background-color', '#1e1e1e');
      document.documentElement.style.setProperty('--text-color', '#e0e0e0');
      document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
      document.documentElement.style.setProperty('--bg-secondary', '#292929');
      document.documentElement.style.setProperty('--bg-highlight', '#2a2a2a');
      document.documentElement.style.setProperty('--modal-bg', '#2a2a2a');
      // Принудительно перезапустить перерисовку компонентов
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: savedTheme } }));
    }
    
    // Добавляем обработчик события загрузки DOM для гарантии применения темы
    window.addEventListener('DOMContentLoaded', () => {
      document.documentElement.setAttribute('data-theme', savedTheme);
      // Запускаем обновление темы ещё раз
      if (savedTheme === 'dark') {
        document.documentElement.style.setProperty('--background-color', '#1e1e1e');
        document.documentElement.style.setProperty('--text-color', '#e0e0e0');
      } else {
        document.documentElement.style.setProperty('--background-color', '#fff');
        document.documentElement.style.setProperty('--text-color', '#000');
      }
    });
    
  }, []);

  // Мемоизация значения value для контекста
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    isDarkMode: theme === 'dark'
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Создаем и экспортируем хук для использования темы
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};