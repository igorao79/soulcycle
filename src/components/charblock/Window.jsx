import React, { useState } from 'react';
import styles from '../../styles/charblock/Window.module.scss';
import Tgbtn from '../charblock/window/Tgbtn';
import AnimatedContent from '../../utils/charblock/AnimatedContent'; // Импортируем объединённый компонент
import CharMenu from './menu/CharMenu'; // Импортируем компонент CharMenu
import IconCarousel from '../charblock/window/IconCarousel'; // Импортируем новый компонент
import characters from '../../data/characters';

const icons = ['faust', 'lonarius', 'vivian', 'character4', 'character5', 'character6']; // Пример списка иконок

function Window() {
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [direction, setDirection] = useState(1); // 1 - вперед, -1 - назад

  // Обработчик клика по иконке
  const handleIconClick = (icon) => {
    setDirection(selectedIcon ? (icons.indexOf(icon) > icons.indexOf(selectedIcon) ? 1 : -1) : 1);
    setSelectedIcon(icon); // При клике устанавливаем название иконки
  };

  return (
    <div className={styles.window}>
      <Tgbtn />
      
      {/* Используем компонент IconCarousel */}
      <IconCarousel icons={icons} onIconClick={handleIconClick} />

      {/* Используем объединённый компонент AnimatedContent */}
      <AnimatedContent selectedIcon={selectedIcon} direction={direction}>
        {selectedIcon && characters[selectedIcon] && (
          <CharMenu
            id={selectedIcon}
            src={characters[selectedIcon]?.src}
            name={characters[selectedIcon]?.name}
            surname={characters[selectedIcon]?.surname}
            age={characters[selectedIcon]?.age}
            height={characters[selectedIcon]?.height}
            bd={characters[selectedIcon]?.bd}
            lore={characters[selectedIcon]?.lore}
          />
        )}
      </AnimatedContent>
    </div>
  );
}

export default Window;
