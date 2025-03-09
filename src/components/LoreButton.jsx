import React, { useState } from 'react';
import styles from './LoreButton.module.scss';
import SplitText from './SplitText';
import Modal from './Modal'; // Импортируем компонент модального окна

const LoreButton = ({ id }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Обработчик для закрытия модального окна по клавише Escape
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  // Используем эффект для добавления обработчика клавиатуры
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className={styles.wrapper}>
        <button className={styles.button} onClick={openModal}>
          <SplitText text="Читать лор" />
          <svg fill="currentColor" viewBox="0 0 24 24" className={styles.icon}>
            <path 
              clipRule="evenodd" 
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" 
              fillRule="evenodd" 
            />
          </svg>
        </button>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} id={id} />
    </>
  );
}

export default LoreButton;
