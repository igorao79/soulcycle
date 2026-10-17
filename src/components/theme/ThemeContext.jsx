import React, { createContext, useState, useMemo, useCallback, useContext } from 'react';

export const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'theme';

const getSavedTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

// Единственное место, где тема применяется к DOM. Все цвета берутся из CSS-переменных
// (App.module.css) по атрибуту data-theme — инлайн-переменные не используются.
// Класс theme-switching на время смены отключает все transition, иначе элементы с разной
// длительностью переходов перекрашиваются рассинхронно (белые вспышки, «дерганье»).
function applyThemeToDOM(themeName) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.setAttribute('data-theme', themeName);
  root.style.colorScheme = themeName;

  // Два кадра: стили новой темы применяются без анимации, затем transition возвращаются
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove('theme-switching'));
  });
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getSavedTheme);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    applyThemeToDOM(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch { /* localStorage недоступен — тема живёт до перезагрузки */ }
    setTheme(newTheme);
  }, [theme]);

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
