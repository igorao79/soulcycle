import React, { useContext, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import { Lottie } from 'react-lottie-lightweight';
import sunAnimation from '../../animations/sun.json'; // Анимация для светлой темы
import moonAnimation from '../../animations/moon.json'; // Анимация для темной темы
import styles from '../../styles/theme/ThemeToggleButton.module.css';

function ThemeToggleButton() {
  const { theme, toggleTheme } = useContext(ThemeContext); // Получаем текущую тему и функцию переключения
  const [isCooldown, setIsCooldown] = useState(false); // Флаг для отслеживания задержки

  // Обработчик клика с задержкой
  const handleClick = () => {
    if (isCooldown) return; // Игнорируем клик, если задержка активна

    toggleTheme(); // Переключаем тему
    setIsCooldown(true); // Активируем задержку

    // Сбрасываем задержку через 3 секунды
    setTimeout(() => {
      setIsCooldown(false);
    }, 3000);
  };

  return (
    <button
      className={`${styles.themeButton} ${isCooldown ? styles.disabled : ''}`}
      onClick={handleClick}
      disabled={isCooldown} // Блокируем кнопку, если задержка активна
      aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Анимация для переключения темы */}
      <Lottie
        config={{
          animationData: theme === 'dark' ? sunAnimation : moonAnimation,
          loop: true,
          autoplay: true,
        }}
        speed={1}
        style={{ width: '35px', height: '35px', display: 'block' }}
      />
    </button>
  );
}

export default ThemeToggleButton;
