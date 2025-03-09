// Modal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css'; // Импортируйте ваши стили
import characters from '../data/characters';
import { getSkilledName } from '../utils/getSkilledName.js'; // Импортируйте функцию из utils

const Modal = ({ isOpen, onClose, id }) => {
  if (!isOpen) return null; // Если модальное окно закрыто, ничего не рендерим

  // Находим персонажа по id
  const character = characters[id];

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton}>
          x
        </button>
        <div className={styles.textContent}>
        <h2 className={styles.title}>Лор {getSkilledName(character)}</h2>
          <p className={styles.text}>Контент {id}</p>
        </div>
      </div>
    </div>,
    document.body 
  );
};

export default Modal;
