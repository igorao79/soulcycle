import React from 'react';
import styles from './App.module.css';
import HomePage from './components/HomePage'; // Добавляем HomePage
import ThemeToggleButton from './components/theme/ThemeToggleButton'; // Новый компонент

function App() {
    return (
        <div className={styles.page}>
            {/* Кнопка переключения темы */}
            <ThemeToggleButton />

            <HomePage /> {/* Рендерим HomePage */}
        </div>
    );
}

export default App;