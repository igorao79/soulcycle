import React from 'react';
import styles from '../../../styles/charblock/Tgbtn.module.css'

const Tgbtn = () => {
    return (
      <a href="https://t.me/+yFsUa_nD88piNjg6" target="_blank" rel="noopener noreferrer" className={styles.button}>
        <div className={styles.icon}>
          <svg width={16} height={16} className="bi bi-telegram" viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.3 6A388.8 388.8 0 0 0 3 8.3c0 .2.3.3.7.4H4l1.2.4.9-.3a82.9 82.9 0 0 1 3.6-2.1l-2 1.9-.3.3a8.2 8.2 0 0 1-.2.2c-.4.4-.7.7 0 1.1A66.2 66.2 0 0 1 9 11.4l.3.2c.3.2.6.4 1 .4.2 0 .4-.2.5-.8l1-5.8a1.4 1.4 0 0 0-.1-.3.3.3 0 0 0-.1-.2.5.5 0 0 0-.3 0c-.3 0-.8 0-3 1z"/>
          </svg>
        </div>
        Telegram
      </a>
    );
  }
  

export default Tgbtn;
