import React from 'react';
import { FiBarChart2, FiSettings, FiSend } from 'react-icons/fi';
import { AiOutlinePushpin } from 'react-icons/ai';
import styles from '../../Post.module.scss';

const FormToggles = ({
  showPoll,
  togglePoll,
  showStylingOptions,
  toggleStylingOptions,
  isPinned,
  setIsPinned,
  isSubmitting
}) => {
  return (
    <div className={styles.formOptions}>
      <div className={styles.formToggles}>
        <label className={styles.optionToggle}>
          <input
            type="checkbox"
            checked={showPoll}
            onChange={togglePoll}
            disabled={isSubmitting}
          />
          <FiBarChart2 /> {showPoll ? "Убрать опрос" : "Добавить опрос"}
        </label>
        
        <label className={styles.optionToggle}>
          <input
            type="checkbox"
            checked={showStylingOptions}
            onChange={toggleStylingOptions}
            disabled={isSubmitting}
          />
          <FiSettings /> {showStylingOptions ? "Скрыть настройки" : "Настройки стиля"}
        </label>
        
        <label className={styles.optionToggle}>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={() => setIsPinned(!isPinned)}
            disabled={isSubmitting}
          />
          <AiOutlinePushpin /> {isPinned ? "Открепить" : "Закрепить"}
        </label>
      </div>
      
      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Публикация...' : <><FiSend /> Опубликовать</>}
      </button>
    </div>
  );
};

export default FormToggles; 