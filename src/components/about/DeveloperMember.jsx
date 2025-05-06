import React, { useMemo, useContext } from 'react';
import { ThemeContext } from '../../components/theme/ThemeContext';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team';
import { CloudinaryImage } from '../../utils/cloudinary';

const DeveloperMember = React.memo(({ memberId }) => {
  const { theme } = useContext(ThemeContext);
  
  // Мемоизируем данные участника
  const member = useMemo(() => team[memberId], [memberId]);

  if (!member) {
    return <div className={styles.member__notfound}>Участник не найден.</div>;
  }

  // Мемоизируем ID для использования в классах
  const safeId = useMemo(() => (
    `member--${member.id.replace(/\s+/g, '-').toLowerCase()}`
  ), [member]);

  return (
    <div className={`${styles.member} ${styles[`member--${member.id}`]}`} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <div className={`${styles.member__imageContainer} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          <CloudinaryImage
            path={member.src}
            alt={member.name}
            className={styles.member__image}
            loading="lazy"
          />
        </div>
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
