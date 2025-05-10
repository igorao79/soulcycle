import React, { useState, useCallback, useEffect } from 'react';
import styles from '../../styles/charblock/Window.module.scss';
import AnimatedContent from '../../utils/charblock/AnimatedContent';
import CharMenu from './menu/CharMenu';
import IconCarousel from '../charblock/window/IconCarousel';
import { useFetchData } from '../hooks/UseFetchData'; // Используем хук

// Очищаем кэш гиста при загрузке скрипта
const clearGistCache = () => {
  const cacheKeys = Object.keys(window.localStorage).filter(key => 
    key.includes('gist.github') || key.includes('githubusercontent')
  );
  cacheKeys.forEach(key => window.localStorage.removeItem(key));
  
  if (window.caches) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
};

// Функция для форматирования лора, если он не в формате HTML
const formatLore = (lore) => {
  if (!lore) return '';
  
  // Если лор уже содержит HTML теги, возвращаем как есть
  if (lore.includes('<p>')) {
    return lore;
  }
  
  // Иначе оборачиваем в <p> теги
  return `<p>${lore}</p>`;
};

const icons = ['faust', 'lonarius', 'vivian', 'akito'];

function Window() {
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [direction, setDirection] = useState(1);
  const [isSwitching, setIsSwitching] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());
  
  // Очищаем кэш один раз при загрузке компонента
  useEffect(() => {
    clearGistCache();
    
    // Устанавливаем уникальный идентификатор для этой сессии, чтобы избежать кэширования
    // Но не перегенерируем его при каждом рендере
    setCacheBuster(Date.now());
  }, []);

  // Используем URL без хеша коммита и с фиксированным временным штампом
  // Запросы будут перезагружаться только если кэш истек (10 минут) или при явном обновлении
  const { data: characters, loading, error, refresh } = useFetchData(
    `/gist/igorao79/17a1e2924e5dbee9371956c24be2a31b/raw/chlore.json?v=${cacheBuster}`,
    { retryInterval: 30000 } // Увеличиваем интервал повторных попыток до 30 секунд
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
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : error ? (
        <div className={styles.error}>
          Ошибка загрузки данных. {!loading && <button onClick={refresh}>Повторить</button>}
        </div>
      ) : (
        <AnimatedContent selectedIcon={selectedIcon} direction={direction}>
          {selectedIcon && characters && characters[selectedIcon] && (
            <CharMenu
              id={selectedIcon}
              src={characters[selectedIcon]?.src}
              name={characters[selectedIcon]?.name}
              surname={characters[selectedIcon]?.surname}
              age={characters[selectedIcon]?.age}
              height={characters[selectedIcon]?.height}
              bd={characters[selectedIcon]?.bd}
              lore={formatLore(characters[selectedIcon]?.lore)}
              characters={characters} // Передаем все данные о персонажах, чтобы избежать повторных запросов
            />
          )}
        </AnimatedContent>
      )}
    </div>
  );
}

export default Window;
