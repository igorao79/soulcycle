import React from 'react';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team'; // Импортируем объект team


const BookMember = ({ memberId }) => {
  const member = team[memberId]; // Получаем данные о члене команды

  if (!member) {
    return <div className={styles.member__notfound}>Участник не найден.</div>;
  }

  // Приводим id к корректному значению
  const safeId = `member--${member.id.replace(/\s+/g, '-').toLowerCase()}`;

  // Получаем стили для данного id

  return (
    <div className={styles.member} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <picture className={styles.member__imageContainer}>
          <source srcSet={member.srcWebp} type="image/webp" />
          <img src={member.src} alt={member.name} className={styles.member__image} />
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
};

export default BookMember;
