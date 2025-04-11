import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FaCrown, FaStar, FaTag } from 'react-icons/fa';
import './CommentUserName.css';

const CommentUserName = ({ userId, nickname }) => {
  const [displayStyle, setDisplayStyle] = useState({
    className: '',
    style: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Используем onSnapshot для динамического обновления при изменении данных
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const activePrivilege = userData.activePrivilege || 'nickname';

        // Определяем стили на основе активной привилегии
        switch (activePrivilege) {
          case 'admin':
            setDisplayStyle({
              className: 'admin-name',
              style: {
                color: '#FFD700',
                fontWeight: 600
              }
            });
            break;
          
          case 'early-user':
            setDisplayStyle({
              className: 'early-user-name',
              style: {
                color: '#FF4444',
                fontWeight: 500
              }
            });
            break;
          
          case 'custom-title':
            setDisplayStyle({
              className: 'custom-title-name',
              style: {
                color: '#4A90E2',
                fontWeight: 500
              }
            });
            break;
          
          default:
            setDisplayStyle({
              className: 'default-name',
              style: {
                color: '#2c3e50',
                fontWeight: 400
              }
            });
        }
      }
      setIsLoading(false);
    });

    // Очищаем подписку при размонтировании компонента
    return () => unsubscribe();
  }, [userId]);

  if (isLoading) {
    return <span className="comment-user-name loading">{nickname}</span>;
  }

  const getPrivilegeIcon = () => {
    switch (displayStyle.className) {
      case 'admin-name':
        return <FaCrown className="privilege-icon" style={{ color: '#FFD700' }} />;
      case 'early-user-name':
        return <FaStar className="privilege-icon" style={{ color: '#FF4444' }} />;
      case 'custom-title-name':
        return <FaTag className="privilege-icon" style={{ color: '#4A90E2' }} />;
      default:
        return null;
    }
  };

  return (
    <span className={`comment-user-name ${displayStyle.className}`}>
      {getPrivilegeIcon()}
      <span style={displayStyle.style}>{nickname}</span>
    </span>
  );
};

export default CommentUserName; 