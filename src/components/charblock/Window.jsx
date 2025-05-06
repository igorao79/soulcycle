import React, { useState, useCallback } from 'react';
import styles from '../../styles/charblock/Window.module.scss';
import AnimatedContent from '../../utils/charblock/AnimatedContent';
import CharMenu from './menu/CharMenu';
import IconCarousel from '../charblock/window/IconCarousel';
import { useFetchData } from '../hooks/UseFetchData'; // Используем хук

const icons = ['faust', 'lonarius', 'vivian', 'akito'];

function Window() {
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [direction, setDirection] = useState(1);
  const [isSwitching, setIsSwitching] = useState(false);

  // Используем хук вместо useEffect
  const { data: characters, loading, error } = useFetchData(
    'https://gist.githubusercontent.com/igorao79/17a1e2924e5dbee9371956c24be2a31b/raw/24a8ba7d250a00e594387072aa0fc47641c6b8a6/chlore.json'
  );

  const handleIconClick = useCallback((icon) => {
    if (isSwitching) return; // Игнорируем повторные клики

    setIsSwitching(true);
    setDirection(selectedIcon ? (icons.indexOf(icon) > icons.indexOf(selectedIcon) ? 1 : -1) : 1);
    setSelectedIcon(icon);

    setTimeout(() => setIsSwitching(false), 300); // Разблокируем через 300 мс
  }, [isSwitching, selectedIcon]);



  return (
    <div className={styles.window}>
      <IconCarousel icons={icons} onIconClick={handleIconClick} />
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
