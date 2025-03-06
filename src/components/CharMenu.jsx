import React from 'react';
import styles from './CharMenu.module.scss';
import { getAgeWord } from '../utils/checkage';

function CharMenu({ id, src, name, surname = '', age = '?', height, bd = '?', lore = '...' }) {
  return (
    <div id={id} className={styles.menu}> {/* Применяем ID */}
      <div className={styles.menu__left}>
        <picture className={styles.menu__left__pic}>
          <source srcSet={`./pics/char/${src}.avif`} type="image/avif" />
          <source srcSet={`./pics/char/${src}.webp`} type="image/webp" />
          <img src={`./pics/char/${src}.png`} alt={`icon-${name}`} />
        </picture>
      </div>
      <div className={styles.menu__right}>
        <div className={styles.menu__right__titleblock}>
          <h2 className={styles.menu__right__titleblock__fullname}>{name} {surname}</h2>
          <div className={styles.menu__right__titleblock__maininfo}>
            <span className={styles.menu__right__titleblock__maininfo__age}>
              Возраст: {age} {age !== '?' && getAgeWord(age)}
            </span>
            <span className={styles.menu__right__titleblock__maininfo__height}>Рост: {height} см</span>
            <span className={styles.menu__right__titleblock__maininfo__bd}>ДР: {bd}</span>
          </div>
        </div>
        <p className={styles.menu__right__lore}>{lore}</p>
      </div>
    </div>
  );
}


export default CharMenu