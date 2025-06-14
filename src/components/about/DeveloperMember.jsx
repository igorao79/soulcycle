import React, { useMemo, useContext } from 'react';
import { ThemeContext } from '../../components/theme/ThemeContext';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team';
import { CloudinaryImage } from '../../utils/cloudinary';
import { Link } from 'react-router-dom';

const DeveloperMember = React.memo(({ memberId, profileUrl }) => {
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
  
  // Extract profile ID from URL if provided
  const profilePath = profileUrl ? new URL(profileUrl).hash.replace('#', '') : null;

  return (
    <div className={`${styles.member} ${styles[`member--${member.id}`]}`} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <div className={`${styles.member__imageContainer} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          {profileUrl ? (
            <Link to={profilePath}>
              <CloudinaryImage
                path={member.src}
                alt={member.name}
                className={styles.member__image}
                width={80}
                height={80}
                loading="lazy"
              />
            </Link>
          ) : (
            <CloudinaryImage
              path={member.src}
              alt={member.name}
              className={styles.member__image}
              width={80}
              height={80}
              loading="lazy"
            />
          )}
        </div>
      </div>
      <div className={styles.member__info}>
        <div className={styles.member__info__details}>
          <h3 className={styles.member__info__details__name}>
            {profileUrl ? (
              <Link to={profilePath} className={styles.member__info__details__link}>
                {member.name}
              </Link>
            ) : (
              member.name
            )}
          </h3>
          <p className={styles.member__info__details__role}>{member.developerteam}</p>
        </div>
      </div>
    </div>
  );
});

// Добавляем displayName для лучшей отладки
DeveloperMember.displayName = 'DeveloperMember';

export default DeveloperMember;
