import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext'; // Импортируем контекст
import Lottie from 'lottie-react'; // Библиотека для работы с Lottie
import sunAnimation from './animations/sun.json'; // Анимация солнца (для светлой темы)
import moonAnimation from './animations/moon.json'; // Анимация луны (для темной темы)
import styles from './styles/ThemeToggleButton.module.css';

function ThemeToggleButton() {
    const { theme, toggleTheme } = useContext(ThemeContext); // Получаем текущую тему и функцию переключения

    return (
        <button
            className={styles.themeButton}
            onClick={toggleTheme} // Вызываем функцию переключения темы
        >
            {/* Добавляем анимированную Lottie-иконку */}
            <Lottie
                animationData={theme === 'dark' ? sunAnimation : moonAnimation}
                loop={true} // Зацикливаем анимацию
                autoplay={true} // Автоматически запускаем анимацию
                speed={0.5} // Замедляем скорость анимации
                style={{ width: 30, height: 30 }} // Размер иконки
            />
        </button>
    );
}

export default ThemeToggleButton;