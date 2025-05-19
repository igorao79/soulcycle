import React from 'react';
import { FiCalendar, FiLoader, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import styles from '../AdminPanel.module.scss';

const SiteEvents = ({ 
  siteEvents, 
  eventsLoading, 
  toggleSiteEvent 
}) => {
  return (
    <div className={styles.eventsSection}>
      <h2>
        <FiCalendar size={18} /> События сайта
      </h2>
      
      {eventsLoading ? (
        <div className={styles.loader}>
          <FiLoader size={24} /> Загрузка настроек событий...
        </div>
      ) : (
        <div className={styles.eventsList}>
          <div className={styles.eventItem}>
            <div className={styles.eventInfo}>
              <h3>Привилегия "Ранний пользователь"</h3>
              <p>Автоматически выдает привилегию "Ранний пользователь" всем новым пользователям при регистрации.</p>
              <p><strong>Статус:</strong> {siteEvents.earlyUserPromotion ? 'Активно' : 'Неактивно'}</p>
            </div>
            <button 
              className={`${styles.eventToggle} ${siteEvents.earlyUserPromotion ? styles.active : ''}`}
              onClick={() => toggleSiteEvent('earlyUserPromotion')}
              disabled={eventsLoading}
            >
              {siteEvents.earlyUserPromotion ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
              {siteEvents.earlyUserPromotion ? 'Выключить' : 'Включить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteEvents; 