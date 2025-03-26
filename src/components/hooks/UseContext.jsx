import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext'; // Импортируйте контекст
import styles from '../../styles/hp/HomePage.module.scss';

const UseContext = ({ src, alt }) => {
  const { theme } = useContext(ThemeContext); // Получаем текущую тему

  // Динамическое формирование пути к изображению
  const getImagePath = (baseSrc) => {
    return theme === 'dark' ? `${baseSrc}-black` : baseSrc;
  };

  return (
    <picture className={styles.main__header__pic}>
      {/* AVIF */}
      <source
        srcSet={`${getImagePath(src)}.avif`}
        type="image/avif"
      />
      {/* WebP */}
      <source
        srcSet={`${getImagePath(src)}.webp`}
        type="image/webp"
      />
      {/* PNG */}
      <img
        src={`${getImagePath(src)}.png`}
        alt={alt}
        loading="lazy"
      />
    </picture>
  );
};

export default UseContext;