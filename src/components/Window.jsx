import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Добавьте motion и AnimatePresence
import styles from './Window.module.scss';
import Icon from './Icon';
import CharMenu from './CharMenu'; // Импортируем компонент CharMenu
import AnimatedCard from '../utils/AnimatedCard'; // Импортируем компонент AnimatedCard
import characters from '../data/characters';

const icons = ['faust', 'lonarius', 'vivian'];

function Window() {
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [direction, setDirection] = useState(1); // 1 - вперед, -1 - назад

  const handleIconClick = (icon) => {
    setDirection(selectedIcon ? (icons.indexOf(icon) > icons.indexOf(selectedIcon) ? 1 : -1) : 1);
    setSelectedIcon(icon); // При клике устанавливаем название иконки
  };

  return (
    <div className={styles.window}>
      <div className={styles.window__panel}>
        {icons.map((icon, index) => (
          <Icon
            key={index}
            src={icon}
            index={index}
            onClick={() => handleIconClick(icon)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {selectedIcon ? (
          <AnimatedCard direction={direction} selectedIcon={selectedIcon}>
            <CharMenu
              id={selectedIcon}
              src={characters[selectedIcon].src}
              name={characters[selectedIcon].name}
              surname={characters[selectedIcon].surname}
              age={characters[selectedIcon].age}
              height={characters[selectedIcon].height}
              bd={characters[selectedIcon].bd}
              lore={characters[selectedIcon].lore}
            />
          </AnimatedCard>
        ) : (
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
        )}
      </AnimatePresence>
    </div>
  );
}

export default Window;
