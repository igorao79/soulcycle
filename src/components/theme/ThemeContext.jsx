import React, { createContext, useState, useEffect, useMemo } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const [theme, setTheme] = useState(savedTheme);

  // Функция для переключения темы
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme); // Устанавливаем атрибут data-theme
    localStorage.setItem('theme', newTheme); // Сохраняем тему в localStorage
  };

  // Устанавливаем начальную тему при первом рендере
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Мемоизация значения value для контекста
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};