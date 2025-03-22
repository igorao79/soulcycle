import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Получаем сохраненную тему из localStorage или используем 'light' по умолчанию
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

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};