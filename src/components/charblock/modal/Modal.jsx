import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../../styles/charblock/Modal.module.scss';
import { lorefilter, splitLoreIntoPages } from '../../../utils/charblock/lorefilter.ts';
import { usePagination } from './hooks/usePagination.js';
import { useFetchData } from '../../hooks/UseFetchData';
import { getSkilledName } from '../../../utils/charblock/getSkilledName.js';

const Modal = ({ isOpen, onClose, id }) => {
  const [fade, setFade] = useState(false);
  const { data: characters, loading, error } = useFetchData(
    'https://gist.githubusercontent.com/igorao79/17a1e2924e5dbee9371956c24be2a31b/raw/24a8ba7d250a00e594387072aa0fc47641c6b8a6/chlore.json'
  );

  const { currentPage, nextPage, prevPage } = usePagination();

  useEffect(() => {
    if (!isOpen) return; // Запрашиваем данные только если модальное окно открыто
  }, [isOpen]);

  // Пока идет загрузка, показываем спиннер или сообщение об ошибке
  if (loading) return <div className={styles.modalOverlay}>Loading...</div>;

  if (error) return <div className={styles.modalOverlay}>Error: {error}</div>;

  const character = characters ? lorefilter(characters, id) : null;
  const pages = character?.lore ? splitLoreIntoPages(character.lore) : [];

  if (!isOpen || !character) return null;  // Закрываем модальное окно, если нет данных

  const handleNextPage = () => {
    setFade(true);
    setTimeout(() => {
      nextPage(pages.length);
      setFade(false);
    }, 300);
  };

  const handlePrevPage = () => {
    setFade(true);
    setTimeout(() => {
      prevPage();
      setFade(false);
    }, 300);
  };

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalOverlay__content} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.modalOverlay__closeButton}>
          <svg width="20" height="20" viewBox="0 0 30 30">
            <path d="M7 4H6L4 6v2l8 7-8 7v2l2 2h2l7-8 7 8h2l2-2v-2l-8-7 8-7V6l-2-2h-2l-7 8-7-8H7z" />
          </svg>
        </button>
        <div className={styles.modalOverlay__textContent}>
          <div className={styles.modalOverlay__navigation}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`${styles.modalOverlay__arrowLeft} ${currentPage === 0 ? styles.disabled : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="m12.718 4.707-1.413-1.415L2.585 12l8.72 8.707 1.413-1.415L6.417 13H20v-2H6.416l6.302-6.293z" />
              </svg>
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === pages.length - 1}
              className={`${styles.modalOverlay__arrowRight} ${currentPage === pages.length - 1 ? styles.disabled : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M11.293 4.707 17.586 11H4v2h13.586l-6.293 6.293 1.414 1.414L21.414 12l-8.707-8.707-1.414 1.414z" />
              </svg>
            </button>
          </div>
          <h2 className={styles.modalOverlay__title}>Лор {getSkilledName(character)}</h2>
          <div className={styles.modalOverlay__textBlock}>
          <div
            className={`${styles.modalOverlay__textBlock__textCont} ${
              fade ? styles.fadeOut : styles.fadeIn
            }`}
            dangerouslySetInnerHTML={{ __html: pages[currentPage] || '' }}  // Используем пустую строку по умолчанию
          />
          </div>
          <div className={styles.modalOverlay__pageIndicator}>
            Страница {currentPage + 1} из {pages.length}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
