import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext'; // Импортируйте контекст
import styles from '../../styles/hp/HomePage.module.scss';

const UseContext = ({ src, alt }) => {
  const { theme } = useContext(ThemeContext); // Получаем текущую тему

  // Убираем суффикс -black из пути к изображению
  const basePath = src.replace('-black', '');

  return (
    <picture className={`${styles.main__header__pic} ${theme === 'dark' ? styles.darkTheme : ''}`}>
      {/* AVIF */}
      <source
        srcSet={`${basePath}.avif`}
        type="image/avif"
      />
      {/* WebP */}
      <source
        srcSet={`${basePath}.webp`}
        type="image/webp"
      />
      {/* PNG */}
      <img
        src={`${basePath}.png`}
        alt={alt}
        loading="lazy"
      />
    </picture>
  );
};

export default UseContext;