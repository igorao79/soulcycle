import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';

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

export const ThemeProvider = ({ children }) => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const [theme, setTheme] = useState(savedTheme);

  // Применяем CSS-переменные при изменении темы
  const applyTheme = useCallback((themeName) => {
    const themeVariables = themes[themeName];
    Object.entries(themeVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
    document.documentElement.setAttribute('data-theme', themeName);
  }, []);

  // Мемоизируем функцию переключения темы
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, [theme, applyTheme]);

  // Устанавливаем начальную тему при первом рендере
  useEffect(() => {
    applyTheme(savedTheme);
  }, [applyTheme, savedTheme]);

  // Мемоизация значения value для контекста
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};