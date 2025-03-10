import React from 'react';
import styles from './CharMenu.module.scss';
import { getAgeWord } from '../utils/checkage';
import SplitText from './SplitText';
import LoreButton from './menu/LoreButton';

function CharMenu({ id, src, name, surname = '', age = '?', height, bd = '?', lore = '...' }) {
  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };

  return (
    <div id={id} className={styles.menu}>
      <div className={styles.menu__left}>
        <picture className={styles.menu__left__pic}>
          <source srcSet={`./pics/char/${src}.avif`} type="image/avif" />
          <source srcSet={`./pics/char/${src}.webp`} type="image/webp" />
          <img src={`./pics/char/${src}.png`} alt={`icon-${name}`} loading="lazy"/>
        </picture>
      </div>
      <div className={styles.menu__right}>
        <div className={styles.menu__right__titleblock}>
          <h2 className={styles.menu__right__titleblock__fullname}>
            <SplitText
              text={`${name} ${surname}`}
              className="text-2xl font-semibold text-center"
              delay={20}
              onLetterAnimationComplete={handleAnimationComplete}
            />
          </h2>
          <div className={styles.menu__right__titleblock__maininfo}>
            <span className={styles.menu__right__titleblock__maininfo__age}>
              <SplitText
                text={`Возраст: ${age} ${age !== '?' && getAgeWord(age)}`}
                className={styles.menu__right__titleblock__maininfo__age}
                delay={30}
              />
            </span>
            <span className={styles.menu__right__titleblock__maininfo__height}>
              <SplitText
                text={`Рост: ${height} см`}
                className={styles.menu__right__titleblock__maininfo__height}
                delay={40}
              />
            </span>
            <span className={styles.menu__right__titleblock__maininfo__bd}>
              <SplitText
                text={`День рождения: ${bd}`}
                className={styles.menu__right__titleblock__maininfo__bd}
                delay={50}
              />
            </span>
          </div>
        </div>
        <LoreButton id={id}></LoreButton>
      </div>
    </div>
  );
}

export default CharMenu;
