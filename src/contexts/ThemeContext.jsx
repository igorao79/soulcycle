import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    // Add transitioning class to disable transitions during theme change
    document.documentElement.classList.add('theme-transitioning');
    document.body.style.willChange = 'background-color, color';
    
    // Use requestAnimationFrame to batch changes in the next frame
    requestAnimationFrame(() => {
      setIsDarkMode(prev => !prev);
      
      // Force a reflow
      void document.documentElement.offsetHeight;
      
      // Remove transitioning class after theme change is complete to re-enable transitions
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        document.body.style.willChange = '';
        
        // Dispatch theme change event
        window.dispatchEvent(new Event('themechange'));
      }, 50); // Small delay to ensure the theme has fully applied
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
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