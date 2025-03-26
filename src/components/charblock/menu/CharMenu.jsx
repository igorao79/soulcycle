import React from 'react';
import styles from '../../../styles/charblock/CharMenu.module.scss';
import appStyles from '../../../App.module.css'; // Импортируем стили из App.module.css
import { getAgeWord } from '../../../utils/charblock/checkage.ts';
import LoreButton from './LoreButton';
import SplitText from '../SplitText';

function CharMenu({ id, src, name, surname = '', age = '?', height, bd = '?' }) {
  return (
    <div id={id} className={styles.menu}>
      <div className={styles.menu__left}>
        <picture className={styles.menu__left__pic}>
          <source srcSet={`/pics/char/picsfull/${src}.avif`} type="image/avif" />
          <source srcSet={`/pics/char/picsfull/${src}.webp`} type="image/webp" />
          <img src={`/pics/char/picsfull/${src}.png`} alt={`icon-${name}`} loading="lazy" />
        </picture>
      </div>
      <div className={styles.menu__right}>
        <div className={styles.menu__right__titleblock}>
          {/* Имя и фамилия */}
          <h2 className={`${styles.menu__right__titleblock__fullname} ${appStyles['text-animation']}`}>
            <SplitText text={`${name} ${surname}`} />
          </h2>

          {/* Основная информация */}
          <div className={styles.menu__right__titleblock__maininfo}>
            <span className={`${styles.menu__right__titleblock__maininfo__age} ${appStyles['text-animation']}`}>
              <SplitText text={`Возраст: ${age} ${age !== '?' && getAgeWord(age)}`} />
            </span>
            <span className={`${styles.menu__right__titleblock__maininfo__height} ${appStyles['text-animation']}`}>
              <SplitText text={`Рост: ${height} см`} />
            </span>
            <span className={`${styles.menu__right__titleblock__maininfo__bd} ${appStyles['text-animation']}`}>
              <SplitText text={`День рождения: ${bd}`} />
            </span>
          </div>
        </div>
        <LoreButton id={id}></LoreButton>
      </div>
    </div>
  );
}

export default CharMenu;