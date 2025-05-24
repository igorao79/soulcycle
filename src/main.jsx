import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/theme/ThemeContext'; // Импортируем провайдер темы
import { AuthProvider } from './contexts/AuthContext'; // Импортируем провайдер авторизации
import './styles/ImageStyles.scss'; // Import global image styles

// Отключаем service worker если он есть
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ThemeProvider> {/* Оборачиваем всё приложение в провайдер темы */}
        <AuthProvider> {/* Оборачиваем приложение в провайдер авторизации */}
            <App />
        </AuthProvider>
    </ThemeProvider>
);