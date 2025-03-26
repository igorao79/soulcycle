import React, { useContext } from 'react';
import { ImageMap } from './ImageMap';
import styles from '../../../styles/charblock/Icon.module.scss';
import { ThemeContext } from '../../theme/ThemeContext';

const Icon = React.memo(({ src, index, onClick }) => {
  const { theme } = useContext(ThemeContext);

  const finalSrc = `${src}-${theme === 'dark' ? 'dark' : 'light'}`;
  const image = ImageMap[finalSrc];

  if (!image) {
    console.warn(`Image not found for source: ${finalSrc}`);
    return null;
  }

  return (
    <div>
      <hr />
      <button className={styles.btn} onClick={onClick}>
        <picture className={styles.btn__pic}>
          <source srcSet={image.avif} type="image/avif" />
          <source srcSet={image.webp} type="image/webp" />
          <img
            src={image.png}
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