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
        });
    }, []); // Пустой массив зависимостей - выполняется только один раз
    
    // Устанавливаем фоновое изображение при смене темы
    useEffect(() => {
        const setCloudinaryBackground = async () => {
            const backgroundName = theme === 'dark' ? 'backgroundblack' : 'background';
            
            // Используем кэшированный формат или fallback
            const format = formatSupportCache || 'jpg';

            // Получаем URL изображения в выбранном формате
            const imageUrl = getCloudinaryUrl(backgroundName, { format, quality: 90 });
            
            // Устанавливаем CSS-переменную с выбранным форматом
            document.documentElement.style.setProperty('--page-bg', `url('${imageUrl}')`);
            console.log(`Background set to ${format} format:`, imageUrl);
        };
        
        setCloudinaryBackground();
    }, [theme]); // И теперь не зависит от определения формата

    return (
        <Router>
            <div className={`${styles.app} ${styles.page}`} data-theme={theme}>
                <HomePage />
                <ThemeToggleButton />
                <VersionChecker />
            </div>
        </Router>
    );
}

export default App;