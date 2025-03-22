import React, { useContext } from 'react';
import styles from '../../../styles/charblock/Icon.module.scss';
import { ThemeContext } from '../../../ThemeContext'; // Импортируйте контекст

function Icon({ src, index, onClick }) {
  // Получаем текущую тему из контекста
  const { theme } = useContext(ThemeContext);

  // Формируем путь к изображению с учетом темы
  const getSrcWithTheme = (baseSrc) => {
    const extension = theme === 'dark' ? 'black' : ''; // Если темная тема, добавляем "black"
    return extension ? `${baseSrc}-${extension}` : baseSrc; // Добавляем приписку, если нужно
  };

  const finalSrc = getSrcWithTheme(src);

  return (
    <div>
      <hr />
      <button className={styles.btn} onClick={onClick}>
        <picture className={styles.btn__pic}>
          <source srcSet={`./pics/icons/${finalSrc}.avif`} type="image/avif" />
          <source srcSet={`./pics/icons/${finalSrc}.webp`} type="image/webp" />
          <img src={`./pics/icons/${finalSrc}.png`} alt={`icon-${index}`} />
        </picture>
      </button>
      <hr />
    </div>
  );
}

export default Icon;