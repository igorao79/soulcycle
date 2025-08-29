import React, { useEffect, useContext } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import styles from './App.module.css';
import HomePage from './components/HomePage';
import ThemeToggleButton from './components/theme/ThemeToggleButton';
import { ThemeContext } from './components/theme/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { getCloudinaryUrl } from './utils/cloudinary.jsx';
import VersionChecker from './utils/VersionChecker';

// Глобальный кэш для определения поддержки форматов
let formatSupportCache = null;
// Кэш для фоновых изображений
let backgroundCache = {};

// Функция для единоразового определения поддерживаемого формата
const detectBestFormat = async () => {
    // Если формат уже определен, используем его
    if (formatSupportCache) {
        return formatSupportCache;
    }

    try {
        // Определяем поддержку AVIF без создания нового запроса при каждой проверке
        const checkAvifSupport = () => {
            return new Promise((resolve) => {
                // Используем более эффективный способ проверки AVIF
                if ('createImageBitmap' in window) {
                    // Создаем очень маленький AVIF image blob для тестирования
                    const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
                    
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = avifData;
                } else {
                    resolve(false);
                }
            });
        };
        
        // Проверка поддержки WebP с помощью фичер-детекта
        const checkWebPSupport = () => {
            const canvas = document.createElement('canvas');
            if (canvas && canvas.getContext && canvas.getContext('2d')) {
                return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            }
            return false;
        };
        
        // Определяем лучший формат
        const hasAvif = await checkAvifSupport();
        const hasWebP = checkWebPSupport();
        
        console.log('Browser supports AVIF:', hasAvif);
        console.log('Browser supports WebP:', hasWebP);
        
        // Выбираем оптимальный формат
        let format = 'jpg'; // По умолчанию
        if (hasAvif) {
            format = 'avif';
        } else if (hasWebP) {
            format = 'webp';
        }

        // Сохраняем результат в глобальный кэш
        formatSupportCache = format;
        return format;
    } catch (error) {
        console.warn('Error detecting image format support:', error);
        formatSupportCache = 'jpg';
        return 'jpg';
    }
};

// Функция для предзагрузки фоновых изображений
const preloadBackgrounds = async () => {
    const format = formatSupportCache || 'jpg';
    
    const backgrounds = [
        { name: 'background', theme: 'light' },
        { name: 'backgroundblack', theme: 'dark' }
    ];
    
    const preloadPromises = backgrounds.map(bg => {
        const cacheKey = `${bg.name}_${format}`;
        
        if (!backgroundCache[cacheKey]) {
            return new Promise((resolve) => {
                const imageUrl = getCloudinaryUrl(bg.name, { format, quality: 90 });
                
                // Предзагружаем изображение
                const img = new Image();
                img.onload = () => {
                    backgroundCache[cacheKey] = imageUrl;
                    console.log(`Background preloaded: ${bg.theme} theme (${format})`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to preload background: ${bg.theme} theme`);
                    resolve(); // Продолжаем даже при ошибке
                };
                img.src = imageUrl;
            });
        }
        return Promise.resolve();
    });
    
    await Promise.all(preloadPromises);
    console.log('All backgrounds preloaded');
};

function App() {
    const { theme } = useContext(ThemeContext);
    const { refreshUser } = useAuth();
    
    // Обработчик события auth:refresh
    useEffect(() => {
        const handleAuthRefresh = () => {
            console.log("App: Received auth:refresh event, refreshing user data");
            refreshUser();
        };
        
        window.addEventListener('auth:refresh', handleAuthRefresh);
        return () => {
            window.removeEventListener('auth:refresh', handleAuthRefresh);
        };
    }, [refreshUser]);
    
    // Определяем поддержку форматов только один раз при загрузке приложения
    useEffect(() => {
        detectBestFormat().then(() => {
            console.log('Image format support detected:', formatSupportCache);
            // После определения формата предзагружаем фоны
            preloadBackgrounds();
        });
    }, []); // Пустой массив зависимостей - выполняется только один раз
    
    // Устанавливаем фоновое изображение при смене темы
    useEffect(() => {
        const setCloudinaryBackground = async () => {
            const backgroundName = theme === 'dark' ? 'backgroundblack' : 'background';
            const format = formatSupportCache || 'jpg';
            const cacheKey = `${backgroundName}_${format}`;
            
            // Используем кешированный URL если доступен
            let imageUrl = backgroundCache[cacheKey];
            
            if (!imageUrl) {
                // Если не в кеше, создаем URL и добавляем в кеш
                imageUrl = getCloudinaryUrl(backgroundName, { format, quality: 90 });
                backgroundCache[cacheKey] = imageUrl;
            }
            
            // Устанавливаем CSS-переменную с кешированным URL
            document.documentElement.style.setProperty('--page-bg', `url('${imageUrl}')`);
            console.log(`Background set from cache: ${theme} theme (${format})`);
        };
        
        // Ждем определения формата перед установкой фона
        if (formatSupportCache) {
            setCloudinaryBackground();
        } else {
            // Если формат еще не определен, ждем его определения
            const checkFormat = setInterval(() => {
                if (formatSupportCache) {
                    setCloudinaryBackground();
                    clearInterval(checkFormat);
                }
            }, 100);
            
            // Очищаем интервал через 5 секунд на всякий случай
            setTimeout(() => clearInterval(checkFormat), 5000);
        }
    }, [theme]);

    return (
        <Router>
            <div id="page-root" className={`${styles.app} ${styles.page}`} data-theme={theme}>
                <div id="bg-effects-root" className={styles.bgEffectsRoot}></div>
                <div className={styles.pageContent}>
                    <HomePage />
                    <div className={styles.desktopThemeToggle}>
                        <ThemeToggleButton />
                    </div>
                    <VersionChecker />
                </div>
            </div>
        </Router>
    );
}

export default App;