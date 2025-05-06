import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/charblock/Window.module.scss';

const AnimatedContent = ({ children, direction, selectedIcon, showMessage = true }) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      {selectedIcon ? (
        <motion.div
          key={selectedIcon}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
          transition={{ duration: 0.3 }}
          layout // Это свойство помогает поддерживать размеры
          style={{ width: '100%', height: '100%' }} // Убедитесь, что размеры остаются фиксированными
        >
          {children}
        </motion.div>
      ) : (
        showMessage && (
          <motion.div
            key="message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.window__message}>
              <h2>Выберите персонажа</h2>
            </div>
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
};

export default AnimatedContent;