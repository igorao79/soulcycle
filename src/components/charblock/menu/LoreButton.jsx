import React, { useState, useEffect } from 'react';
import styles from '../../../styles/charblock/LoreButton.module.scss';
import appStyles from '../../../App.module.css';
import SplitText from '../SplitText';
import Modal from '../modal/Modal';

const LoreButton = ({ id, characters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className={styles.wrapper}>
        <button className={styles.button} onClick={openModal}>
          <span className={`${appStyles['text-animation']} ${appStyles['text-animation-slow']}`}>
            <SplitText text="Читать лор" />
          </span>
          <svg fill="currentColor" viewBox="0 0 24 24" className={styles.icon}>
            <path 
              clipRule="evenodd" 
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" 
              fillRule="evenodd" 
            />
          </svg>
        </button>
      </div>
      {mounted && isModalOpen && <Modal isOpen={isModalOpen} onClose={closeModal} id={id} characters={characters} />}
    </>
  );
};

export default LoreButton;
