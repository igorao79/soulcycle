import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';
import styles from '../../styles/about/Member.module.scss';
import team from '../../data/team';
import { CloudinaryImage } from '../../utils/cloudinary';
import { Link } from 'react-router-dom';

// roleKey — поле team[memberId] с названием роли (bookteam / developerteam), showBio — показывать ли описание
const TeamMember = React.memo(({ memberId, profilePath, roleKey = 'bookteam', showBio = true }) => {
  const { theme } = useContext(ThemeContext);
  
  const member = team[memberId];

  if (!member) {
    return <div className={styles.member__notfound}>Участник не найден.</div>;
  }

  const safeId = `member--${member.id.replace(/\s+/g, '-').toLowerCase()}`;


  return (
    <div className={`${styles.member} ${styles[`member--${member.id}`]}`} id={safeId}>
      <div className={styles.member__imageWrapper}>
        <div className={`${styles.member__imageContainer} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          {profilePath ? (
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
            {profilePath ? (
              <Link to={profilePath} className={styles.member__info__details__link}>
                {member.name}
              </Link>
            ) : (
              member.name
            )}
          </h3>
          <p className={styles.member__info__details__role}>{member[roleKey]}</p>
        </div>
        {showBio && <p className={styles.member__info__bio}>{member.bio}</p>}
      </div>
    </div>
  );
});

// Добавляем displayName для лучшей отладки
TeamMember.displayName = 'TeamMember';

export default TeamMember;
