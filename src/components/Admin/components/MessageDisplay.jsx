import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import styles from '../AdminPanel.module.scss';

const MessageDisplay = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className={`${styles.message} ${styles[message.type]}`}>
      {message.type === 'success' && <FiCheckCircle size={20} style={{ marginRight: '10px' }} />}
      {message.type === 'error' && <FiAlertCircle size={20} style={{ marginRight: '10px' }} />}
      {message.type === 'info' && <FiInfo size={20} style={{ marginRight: '10px' }} />}
      {message.text}
    </div>
  );
};

export default MessageDisplay; 