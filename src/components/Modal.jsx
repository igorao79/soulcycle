import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.scss';
import { lorefilter, splitLoreIntoPages } from '../utils/lorefilter.js';
import { usePagination } from './hooks/usePagination';
import characters from '../data/characters';
import { getSkilledName } from '../utils/getSkilledName.js';

const Modal = ({ isOpen, onClose, id }) => {
  if (!isOpen) return null;

  const character = lorefilter(characters, id);
  if (!character) return null;

  const pages = splitLoreIntoPages(character.lore);
  const { currentPage, nextPage, prevPage } = usePagination();

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalOverlay__content} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.modalOverlay__closeButton}>
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 30 30">
            <path d="M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z"></path>
          </svg>
        </button>
        <div className={styles.modalOverlay__textСontent}>
          <div className={styles.modalOverlay__navigation}>
            <button onClick={() => prevPage()} disabled={currentPage === 0} className={styles.modalOverlay__arrowLeft}>←</button>
            <button onClick={() => nextPage(pages.length)} disabled={currentPage === pages.length - 1} className={styles.modalOverlay__arrowRight}>→</button>
          </div>
          <h2 className={styles.modalOverlay__title}>Лор {getSkilledName(character)}</h2>
          <div className={styles.modalOverlay__textBlock}>
            <div dangerouslySetInnerHTML={{ __html: pages[currentPage] }} />
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
