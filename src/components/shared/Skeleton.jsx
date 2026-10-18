import React from 'react';
import styles from './Skeleton.module.css';

/**
 * Базовый скелетон-блок. Размеры задают место под будущий контент,
 * поэтому страница не прыгает, когда данные приходят.
 */
const Skeleton = ({ width = '100%', height = 14, radius = 6, circle = false, style, className = '' }) => (
  <span
    aria-hidden="true"
    className={`${styles.skeleton} ${className}`}
    style={{
      width,
      height: circle ? width : height,
      borderRadius: circle ? '50%' : radius,
      flexShrink: 0,
      ...style,
    }}
  />
);

/** Скелетон поста: шапка, текст и блок изображения */
export const PostSkeleton = () => (
  <div className={styles.card} role="status" aria-label="Загрузка поста">
    <div className={styles.row}>
      <Skeleton circle width={40} />
      <div className={styles.column}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="18%" height={10} />
      </div>
    </div>
    <Skeleton width="60%" height={20} />
    <div className={styles.column}>
      <Skeleton height={12} />
      <Skeleton height={12} />
      <Skeleton width="80%" height={12} />
    </div>
    <Skeleton height={180} radius={10} />
    <div className={styles.row}>
      <Skeleton width={56} height={28} radius={14} />
      <Skeleton width={56} height={28} radius={14} />
    </div>
  </div>
);

/** Скелетон комментария: аватар + две строки */
export const CommentSkeleton = () => (
  <div className={styles.row} style={{ alignItems: 'flex-start', padding: '8px 0' }}>
    <Skeleton circle width={32} />
    <div className={styles.column}>
      <Skeleton width="25%" height={12} />
      <Skeleton height={12} />
      <Skeleton width="70%" height={12} />
    </div>
  </div>
);

/** Скелетон строки списка (пользователи в админке, настройки) */
export const ListRowSkeleton = ({ avatar = true }) => (
  <div className={styles.row} style={{ padding: '10px 0' }}>
    {avatar && <Skeleton circle width={40} />}
    <div className={styles.column}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="25%" height={10} />
    </div>
    <Skeleton width={72} height={28} radius={8} />
  </div>
);

/** Скелетон страницы профиля */
export const ProfileSkeleton = () => (
  <div className={styles.card} role="status" aria-label="Загрузка профиля" style={{ alignItems: 'center', maxWidth: 560, margin: '0 auto' }}>
    <Skeleton circle width={120} />
    <Skeleton width={180} height={22} />
    <Skeleton width={110} height={14} />
    <div className={styles.column} style={{ width: '100%', flex: 'none', marginTop: 12 }}>
      <Skeleton height={44} radius={10} />
      <Skeleton height={44} radius={10} />
      <Skeleton height={44} radius={10} />
    </div>
  </div>
);

/** Скелетон сетки персонажей */
export const CharactersSkeleton = ({ count = 8 }) => (
  <div
    role="status"
    aria-label="Загрузка персонажей"
    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16, padding: 16 }}
  >
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} height={140} radius={14} />
    ))}
  </div>
);

export default Skeleton;
