import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../../styles/charblock/Modal.module.scss';
import { lorefilter, splitLoreIntoPages } from '../../../utils/charblock/lorefilter.js';
import { usePagination } from './hooks/usePagination.js';
import characters from '../../../data/characters.js';
import { getSkilledName } from '../../../utils/charblock/getSkilledName.js';

const Modal = ({ isOpen, onClose, id }) => {
  const [fade, setFade] = useState(false);
  
  const character = lorefilter(characters, id);
  const pages = splitLoreIntoPages(character?.lore || "");

  const { currentPage, nextPage, prevPage } = usePagination();

  if (!isOpen) return null;
  if (!character) return null;

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
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 30 30">
            <path d="M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z"></path>
          </svg>
        </button>
        <div className={styles.modalOverlay__textContent}>
          <div className={styles.modalOverlay__navigation}>
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 0} 
              className={`${styles.modalOverlay__arrowLeft} ${currentPage === 0 ? styles.disabled : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m12.718 4.707-1.413-1.415L2.585 12l8.72 8.707 1.413-1.415L6.417 13H20v-2H6.416l6.302-6.293z"/></svg>
            </button>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === pages.length - 1} 
              className={`${styles.modalOverlay__arrowRight} ${currentPage === pages.length - 1 ? styles.disabled : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M11.293 4.707 17.586 11H4v2h13.586l-6.293 6.293 1.414 1.414L21.414 12l-8.707-8.707-1.414 1.414z"/></svg>
            </button>
          </div>
          <h2 className={styles.modalOverlay__title}>Лор {getSkilledName(character)}</h2>
          <div className={styles.modalOverlay__textBlock}>
            <div className={`${styles.modalOverlay__textBlock__textCont} ${fade ? styles.fadeOut : styles.fadeIn}`} dangerouslySetInnerHTML={{ __html: pages[currentPage] }} />
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
