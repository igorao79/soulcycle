import React, { useEffect, useContext } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import styles from './App.module.css';
import HomePage from './components/HomePage';
import ThemeToggleButton from './components/theme/ThemeToggleButton';
import { ThemeContext } from './components/theme/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { getCloudinaryUrl } from './utils/cloudinary.jsx';
import VersionChecker from './utils/VersionChecker';

// Кэш для фоновых изображений
let backgroundCache = {};

// Промис для определения формата — резолвится один раз
let formatDetectPromise = null;
let formatSupportCache = localStorage.getItem('browser-image-format');

const detectBestFormat = () => {
    if (formatSupportCache) return Promise.resolve(formatSupportCache);
    if (formatDetectPromise) return formatDetectPromise;

    formatDetectPromise = (async () => {
        try {
            // Проверка AVIF
            const hasAvif = await new Promise((resolve) => {
                if (!('createImageBitmap' in window)) return resolve(false);
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
            });

            // Проверка WebP
            const canvas = document.createElement('canvas');
            const hasWebP = canvas.getContext && canvas.getContext('2d')
                ? canvas.toDataURL('image/webp').startsWith('data:image/webp')
                : false;

            const format = hasAvif ? 'avif' : hasWebP ? 'webp' : 'jpg';

            formatSupportCache = format;
            localStorage.setItem('browser-image-format', format);
            return format;
        } catch {
            formatSupportCache = 'jpg';
            localStorage.setItem('browser-image-format', 'jpg');
            return 'jpg';
        }
    })();

    return formatDetectPromise;
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
    
    // Определяем поддержку форматов и предзагружаем фоны один раз
    useEffect(() => {
        detectBestFormat().then(() => preloadBackgrounds());
    }, []);

    // Устанавливаем фоновое изображение при смене темы
    useEffect(() => {
        const setBackground = async () => {
            const format = await detectBestFormat();
            const backgroundName = theme === 'dark' ? 'backgroundblack' : 'background';
            const cacheKey = `${backgroundName}_${format}`;

            let imageUrl = backgroundCache[cacheKey];
            if (!imageUrl) {
                imageUrl = getCloudinaryUrl(backgroundName, { format, quality: 90 });
                backgroundCache[cacheKey] = imageUrl;
            }

            document.documentElement.style.setProperty('--page-bg', `url('${imageUrl}')`);
        };

        setBackground();
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