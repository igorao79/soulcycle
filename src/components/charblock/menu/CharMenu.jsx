import React, { useState, useEffect } from 'react';
import styles from '../../../styles/charblock/CharMenu.module.scss';
import appStyles from '../../../App.module.css'; // Импортируем стили из App.module.css
import { getAgeWord } from '../../../utils/charblock/checkage.ts';
import { CloudinaryImage, getCloudinaryUrl } from '../../../utils/cloudinary.jsx';
import LoreButton from './LoreButton';
import SplitText from '../SplitText';

function CharMenu({ id, src, name, surname = '', age = '?', height, bd = '?', lore, characters }) {
  // Определяем, использовать ли локальный путь или Cloudinary
  const isLocalPath = src && (src.startsWith('./') || src.startsWith('http'));
  
  // Получаем путь к изображению
  const getImagePath = (format) => {
    if (isLocalPath) {
      return `./pics/char/picsfull/${src}.${format}`;
    }
    
    // Для Cloudinary используем id персонажа с суффиксом full
    return getCloudinaryUrl(`${id}full`, { quality: 90, format });
  };

  return (
    <div id={id} className={styles.menu}>
      <div className={styles.menu__left}>
        {isLocalPath ? (
          // Для локальных изображений используем старый подход
          <picture className={styles.menu__left__pic}>
            <source srcSet={`./pics/char/picsfull/${src}.avif`} type="image/avif" />
            <source srcSet={`./pics/char/picsfull/${src}.webp`} type="image/webp" />
            <img 
              src={`./pics/char/picsfull/${src}.png`} 
              alt={`icon-${name}`} 
              loading="lazy"
              onError={(e) => {
                console.warn('Ошибка загрузки изображения персонажа:', e.target.src);
              }}
            />
          </picture>
        ) : (
          // Для Cloudinary используем новый компонент с правильными размерами
          <CloudinaryImage
            path={`${id}full`}
            alt={`${name} ${surname}`}
            className={styles.menu__left__pic}
            style={{ maxWidth: '500px', aspectRatio: '1 / 1' }}
            loading="eager"
            priority={true}
            width={500}
            height={500}
          />
        )}
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
        <LoreButton id={id} characters={characters}></LoreButton>
      </div>
    </div>
  );
}

export default CharMenu;