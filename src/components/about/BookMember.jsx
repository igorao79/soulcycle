import React from 'react';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team';

const BookMember = React.memo(({ memberId }) => {
  const member = team[memberId];

  if (!member) {
    return <div className={styles.member__notfound}>Участник не найден.</div>;
  }

  // Путь к изображению (без зависимости от темы)
  const imageSrc = `./pics/team/${member.src}`;

  if (!imageSrc) {
    return <div className={styles.member__notfound}>Изображение не найдено.</div>;
  }

  const safeId = `member--${member.id.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={styles.member} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <picture className={styles.member__imageContainer}>
          <source srcSet={`${imageSrc}.avif`} type="image/avif" />
          <source srcSet={`${imageSrc}.webp`} type="image/webp" />
          <img
            src={`${imageSrc}.png`}
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
