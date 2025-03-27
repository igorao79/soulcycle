import React, { useContext, useMemo } from 'react';
import { ThemeContext } from '../../theme/ThemeContext';
import styles from '../../../styles/charblock/Icon.module.scss';

const Icon = React.memo(({ src, index, onClick }) => {
  const { theme } = useContext(ThemeContext);

  // Мемоизируем пути к изображениям
  const imagePaths = useMemo(() => ({
    avif: `./pics/icons/${src}.avif`,
    webp: `./pics/icons/${src}.webp`,
    png: `./pics/icons/${src}.png`
  }), [src]);

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
          />
        </picture>
      </button>
      <hr />
    </div>
  );
});

Icon.displayName = 'Icon';

export default Icon;