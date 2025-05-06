import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import styles from "../../../styles/charblock/Window.module.scss";

const IconCarousel = ({ icons, onIconClick }) => {
  const [startIndex, setStartIndex] = useState(0);

  const handlePrev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev < icons.length - 3 ? prev + 1 : prev));
  };

  const visibleIcons = icons.slice(startIndex, startIndex + 3);

  return (
    <div className={styles.window__panel}>
      <div className={styles.window__panel__navButtons}>
        {/* Кнопка "Назад" */}
        <button
          className={`${styles.window__panel__navButtons__navButton} ${
            startIndex === 0 ? styles.disabled : ""
          }`}
          onClick={handlePrev}
          disabled={startIndex === 0}
          aria-label="Назад"
        >
          <span className={styles.window__panel__navButtons__navButton__arrow}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="m3.293 11.293 1.414 1.414L11 6.414V20h2V6.414l6.293 6.293 1.414-1.414L12 2.586l-8.707 8.707z" />
            </svg>
          </span>
        </button>

        {/* Контейнер с иконками */}
        <div className={styles.window__panel__iconWrapper}>
          <AnimatePresence mode="popLayout">
            {visibleIcons.map((icon, index) => (
              <motion.div
                key={startIndex + index}
                initial={{ y: -50, opacity: 0 }} // Появление сверху
                animate={{ y: 0, opacity: 1 }} // Плавное появление
                exit={{ y: 50, opacity: 0 }} // Исчезновение вниз
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={styles.window__panel__iconWrapper__icons} // Чтобы не пропадал gap
              >
                <Icon
                  src={icon}
                  index={startIndex + index}
                  onClick={() => onIconClick(icon)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Кнопка "Вперёд" */}
        <button
          className={`${styles.window__panel__navButtons__navButton} ${
            startIndex >= icons.length - 3 ? styles.disabled : ""
          }`}
          onClick={handleNext}
          disabled={startIndex >= icons.length - 3}
          aria-label="Вперёд"
        >
          <span className={styles.window__panel__navButtons__navButton__arrow}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="M13 17.586V4h-2v13.586l-6.293-6.293-1.414 1.414L12 21.414l8.707-8.707-1.414-1.414L13 17.586z" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default IconCarousel;
