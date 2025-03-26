import React, { useContext } from 'react';
import { ThemeContext } from '../../theme/ThemeContext';
import styles from '../../../styles/charblock/Icon.module.scss';

const Icon = React.memo(({ src, index, onClick }) => {
  const { theme } = useContext(ThemeContext);

  // Формирование пути к изображению в папке public
  const finalSrc = `./pics/icons/${src}${theme === 'dark' ? '-black' : ''}`;

  return (
    <div>
      <hr />
      <button className={styles.btn} onClick={onClick}>
        <picture className={styles.btn__pic}>
          <source srcSet={`${finalSrc}.avif`} type="image/avif" />
          <source srcSet={`${finalSrc}.webp`} type="image/webp" />
          <img
            src={`${finalSrc}.png`}
            alt={`icon-${index}`}
            loading="lazy"
          />
        </picture>
      </button>
      <hr />
    </div>
  );
});

export default Icon;