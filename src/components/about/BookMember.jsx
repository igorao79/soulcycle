import React from 'react';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team';

// Динамический импорт изображений
const imageModules = import.meta.glob('/src/pics2/team/*.{jpeg,jpg,png,avif,webp}', { 
  eager: true,
  query: { as: 'url' } // Это обеспечит строки с путями
});

// Создаем карту изображений
export const ImageMap = Object.fromEntries(
  Object.entries(imageModules).map(([path, module]) => {
    const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '');
    return [fileName, {
      avif: path.replace(/\.[^/.]+$/, '.avif'),
      webp: path.replace(/\.[^/.]+$/, '.webp'),
      jpeg: path.replace(/\.[^/.]+$/, '.jpeg'),
      default: module.default // Используем импортированный URL
    }];
  })
);

const BookMember = React.memo(({ memberId }) => {
  const member = team[memberId];

  if (!member) {
    return <div className={styles.member__notfound}>Участник не найден.</div>;
  }

  const image = ImageMap[member.src];

  if (!image) {
    return <div className={styles.member__notfound}>Изображение не найдено.</div>;
  }

  const safeId = `member--${member.id.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={styles.member} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <picture className={styles.member__imageContainer}>
          <source srcSet={image.avif} type="image/avif" />
          <source srcSet={image.webp} type="image/webp" />
          <img 
            src={image.default} 
            alt={member.name} 
            className={styles.member__image}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div className={styles.member__info}>
        <div className={styles.member__info__details}>
          <h3 className={styles.member__info__details__name}>{member.name}</h3>
          <p className={styles.member__info__details__role}>{member.bookteam}</p>
        </div>
        <p className={styles.member__info__bio}>{member.bio}</p>
      </div>
    </div>
  );
});

export default BookMember;