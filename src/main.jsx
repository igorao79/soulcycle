import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/theme/ThemeContext'; // Импортируем провайдер темы
import { AuthProvider } from './contexts/AuthContext'; // Импортируем провайдер авторизации

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ThemeProvider> {/* Оборачиваем всё приложение в провайдер темы */}
        <AuthProvider> {/* Оборачиваем приложение в провайдер авторизации */}
            <App />
        </AuthProvider>
    </ThemeProvider>
);