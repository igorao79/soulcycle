import React from 'react';
import styles from './Icon.module.scss';

function Icon({ src, index, onClick }) { // Добавляем пропс onClick
  return (
    <div>
      <hr />
      <button className={styles.btn} onClick={onClick}> {/* Добавляем обработчик клика */}
        <picture className={styles.btn__pic}>
          <source srcSet={`/pics/icons/${src}.avif`} type="image/avif" />
          <source srcSet={`/pics/icons/${src}.webp`} type="image/webp" />
          <img src={`/pics/icons/${src}.jpg`} alt={`icon-${index}`} />
        </picture>
      </button>
      <hr />
    </div>
  );
}

export default Icon;