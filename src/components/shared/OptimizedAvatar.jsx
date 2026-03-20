import React, { useState } from 'react';
import { Avatar, AVATARS } from '../../utils/cloudinary';

// Скелетон для внешних URL-аватаров
const ExternalAvatar = ({ src, alt, className, style, onLoad, size }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-block' }}>
      {!loaded && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0,
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(90deg, var(--bg-secondary, #e0e0e0) 25%, var(--bg-highlight, #f0f0f0) 50%, var(--bg-secondary, #e0e0e0) 75%)',
            backgroundSize: '200% 100%',
            animation: 'avatar-skeleton-pulse 1.5s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt || "Аватар пользователя"}
        className={className}
        style={{
          ...style,
          objectFit: 'cover',
          imageRendering: 'auto',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        loading="eager"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          setLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          setLoaded(true);
          e.target.src = `https://res.cloudinary.com/do9t8preg/image/upload/q_85,dpr_auto,fl_progressive/v1746775570/${AVATARS.GUEST}`;
          e.target.onerror = null;
        }}
      />
    </div>
  );
};

const OptimizedAvatar = ({ src, alt, className, onLoad, style }) => {
  // Определяем имя аватара для Cloudinary
  let avatarName = AVATARS.GUEST;
  
  // Получаем размер аватара из стилей или параметров - БЕЗ УВЕЛИЧЕНИЯ!
  const getAvatarSize = () => {
    if (style?.width) {
      return parseInt(style.width, 10); // Используем оригинальный размер
    } else if (style?.height) {
      return parseInt(style.height, 10); // Используем оригинальный размер
    }
    
    // Определяем размер на основе className
    if (className) {
      // Для профильных аватаров
      if (className.includes('profileAvatar')) {
        return 180;
      }
      // Для аватаров в кнопке авторизации
      if (className.includes('avatar')) {
        return 42;
      }
      // Для аватаров в модальном окне выбора
      if (className.includes('avatarImage')) {
        return 90;
      }
      // Для мелких аватаров участников команды
      if (className.includes('member__image')) {
        return 80;
      }
    }
    
    return 40; // Размер по умолчанию
  };

  // Проверяем, является ли src строкой и не пустой
  const isValidSrc = typeof src === 'string' && src.trim().length > 0;
  
  // Если src не валидный, используем гостевой аватар
  if (!isValidSrc) {
    return (
      <Avatar
        avatar={AVATARS.GUEST}
        alt={alt || "Аватар пользователя"}
        className={className}
        style={{
          ...style,
          objectFit: 'cover',
          imageRendering: 'auto',
        }}
        size={getAvatarSize()}
        onLoad={onLoad}
      />
    );
  }

  // Проверяем, является ли src прямым значением из AVATARS
  const isDirectAvatarValue = Object.values(AVATARS).includes(src);
  if (isDirectAvatarValue) {
    avatarName = src;
  }
  // Если не прямое значение, проверяем по включениям
  else if (src.includes('pfp1') || src.includes('vivian')) {
    avatarName = AVATARS.VIVIAN;
  } else if (src.includes('pfp2') || src.includes('akito')) {
    avatarName = AVATARS.AKITO;
  } else if (src.includes('pfp3') || src.includes('lonarius')) {
    avatarName = AVATARS.LONARIUS;
  } else if (src.includes('pfp4') || src.includes('faust')) {
    avatarName = AVATARS.FAUST;
  } else if (src.includes('igorpic') || src === AVATARS.IGOR) {
    avatarName = AVATARS.IGOR;
  } else if (src.includes('lesyapic') || src === AVATARS.LESYA) {
    avatarName = AVATARS.LESYA;
  } else if (src.startsWith('http') || src.startsWith('data:')) {
    return (
      <ExternalAvatar
        src={src}
        alt={alt}
        className={className}
        style={style}
        onLoad={onLoad}
        size={getAvatarSize()}
      />
    );
  }
  
  // Используем компонент Avatar из cloudinary.jsx с правильными размерами
  return (
    <Avatar
      avatar={avatarName}
      alt={alt || "Аватар пользователя"}
      className={className}
      style={{
        ...style,
        objectFit: 'cover',
        imageRendering: 'auto',
      }}
      size={getAvatarSize()}
      onLoad={onLoad}
    />
  );
};

export default OptimizedAvatar; 