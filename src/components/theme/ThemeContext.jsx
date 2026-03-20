import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';

export const ThemeContext = createContext();

const themes = {
  light: {
    '--primary-color': '#000000',
    '--background-color': '#fff',
    '--text-color': '#000',
    '--secondary-color': '#666666',
    '--accent-color': '#3498db',
    '--text-primary': '#222222',
    '--bg-secondary': '#f8f9fa',
    '--bg-highlight': '#f5f8fa',
    '--modal-bg': '#ffffff',
  },
  dark: {
    '--primary-color': '#ffffff',
    '--background-color': '#1e1e1e',
    '--text-color': '#e0e0e0',
    '--secondary-color': '#999999',
    '--accent-color': '#3498db',
    '--text-primary': '#e0e0e0',
    '--bg-secondary': '#292929',
    '--bg-highlight': '#2a2a2a',
    '--modal-bg': '#2a2a2a',
  }
};

// Единственная функция для применения темы — вызывается из всех мест
function applyThemeToDOM(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);

  // Сбрасываем старые CSS-переменные
  const styleProps = getComputedStyle(document.documentElement);
  for (let i = 0; i < styleProps.length; i++) {
    const prop = styleProps[i];
    if (prop.startsWith('--')) {
      document.documentElement.style.removeProperty(prop);
    }
  }

  // Применяем все переменные новой темы
  const themeVariables = themes[themeName];
  if (themeVariables) {
    Object.entries(themeVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }
}

export const ThemeProvider = ({ children }) => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const [theme, setTheme] = useState(savedTheme);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    applyThemeToDOM(newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);

    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  }, [theme]);

  // Инициализация при первом рендере
  useEffect(() => {
    applyThemeToDOM(savedTheme);
  }, []);

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

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
