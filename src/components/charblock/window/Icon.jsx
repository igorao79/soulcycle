import React, { useContext, useMemo } from 'react';
import { ThemeContext } from '../../theme/ThemeContext';
import { getCloudinaryUrl } from '../../../utils/cloudinary.jsx';
import styles from '../../../styles/charblock/Icon.module.scss';

/**
 * Компонент для отображения иконок персонажей
 * с поддержкой темной/светлой темы
 */
const Icon = React.memo(({ src, index, onClick }) => {
  const { theme } = useContext(ThemeContext);

  // Мемоизируем пути к изображениям
  const imagePaths = useMemo(() => {
    // Проверяем, начинается ли путь с ./ или http
    const isLocalPath = src.startsWith('./') || src.startsWith('http');
    
    if (isLocalPath) {
      return {
        avif: `./pics/icons/${src}.avif`,
        webp: `./pics/icons/${src}.webp`,
        png: `./pics/icons/${src}.png`
      };
    }
    
    // Для Cloudinary просто используем имя персонажа/иконки
    return {
      avif: getCloudinaryUrl(src, { quality: 90, format: 'avif' }),
      webp: getCloudinaryUrl(src, { quality: 90, format: 'webp' }),
      png: getCloudinaryUrl(src, { quality: 90, format: 'png' })
    };
  }, [src]);

  return (
    <div>
      <hr />
      <button className={styles.btn} onClick={onClick}>
        <picture className={`${styles.btn__pic} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          <source srcSet={imagePaths.avif} type="image/avif" />
          <source srcSet={imagePaths.webp} type="image/webp" />
          <img
            src={imagePaths.png}
            alt={`icon-${index}`}
            loading="eager"
            decoding="async"
            onError={(e) => {
              console.warn('Ошибка загрузки иконки:', e.target.src);
            }}
          />
        </picture>
      </button>
      <hr />
    </div>
  );
});

Icon.displayName = 'Icon';

export default Icon;