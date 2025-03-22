import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './ThemeContext'; // Импортируем провайдер

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ThemeProvider> {/* Оборачиваем всё приложение в провайдер */}
        <App />
    </ThemeProvider>
);