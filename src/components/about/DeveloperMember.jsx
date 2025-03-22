import React from 'react';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team'; // Импортируем объект team по умолчанию

const DeveloperMember = ({ memberId }) => {
  const member = team[memberId]; // Получаем данные о члене команды

  if (!member) {
    return <div>Участник не найден.</div>;
  }

  return (
    <div className={`${styles.member} ${styles[`member--${member.id}`]}`}>
      <div className={styles.member__imageWrapper}>
        <picture className={styles.member__imageContainer}>
          <source srcSet={member.srcWebp} type="image/webp" />
          <img src={member.src} alt={member.name} className={styles.member__image} />
        </picture>
      </div>
      <div className={styles.member__info}>
        <div className={styles.member__info__details}>
          <h3 className={styles.member__info__details__name}>{member.name}</h3>
          <p className={styles.member__info__details__role}>{member.developerteam}</p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperMember;
