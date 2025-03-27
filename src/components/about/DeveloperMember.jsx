import React, { useMemo, useContext } from 'react';
import { ThemeContext } from '../../components/theme/ThemeContext';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team';

const DeveloperMember = React.memo(({ memberId }) => {
  const { theme } = useContext(ThemeContext);
  
  // Мемоизируем данные участника
  const member = useMemo(() => team[memberId], [memberId]);

  if (!member) {
    return <div className={styles.member__notfound}>Участник не найден.</div>;
  }

  // Мемоизируем путь к изображению и ID
  const { imageSrc, safeId } = useMemo(() => ({
    imageSrc: `./pics/team/${member.src}`,
    safeId: `member--${member.id.replace(/\s+/g, '-').toLowerCase()}`
  }), [member]);

  if (!imageSrc) {
    return <div className={styles.member__notfound}>Изображение не найдено.</div>;
  }

  return (
    <div className={`${styles.member} ${styles[`member--${member.id}`]}`} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <picture className={`${styles.member__imageContainer} ${theme === 'dark' ? styles.darkTheme : ''}`}>
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
          <p className={styles.member__info__details__role}>{member.developerteam}</p>
        </div>
      </div>
    </div>
  );
});

// Добавляем displayName для лучшей отладки
DeveloperMember.displayName = 'DeveloperMember';

export default DeveloperMember;
