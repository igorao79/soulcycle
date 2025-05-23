import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import styles from './App.module.css';
import HomePage from './components/HomePage';
import ThemeToggleButton from './components/theme/ThemeToggleButton';
import { ThemeContext } from './components/theme/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { getCloudinaryUrl } from './utils/cloudinary.jsx';
import VersionChecker from './utils/VersionChecker';

// Определяем basename в зависимости от окружения
const basename = import.meta.env.DEV ? '/' : '/soulcycle';

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
    
    // Устанавливаем фоновое изображение из Cloudinary с надежным определением формата
    useEffect(() => {
        // Кэшируем результаты определения формата
        let formatCache = null;

        // Функция для определения поддерживаемого формата
        const detectBestFormat = async () => {
            // Если формат уже определен, используем его
            if (formatCache) {
                return formatCache;
            }

            // Определяем поддержку AVIF
            const checkAvifSupport = async () => {
                try {
                    // Создаем канвас для проверки AVIF вместо загрузки тестового изображения
                    if (self.createImageBitmap) {
                        const avifBlob = await fetch(
                            'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=',
                            { method: 'HEAD' }
                        ).then(response => response.ok);
                        return avifBlob;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            };
            
            // Проверка поддержки WebP с помощью фичер-детекта без загрузки изображения
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

            // Сохраняем результат в кэш
            formatCache = format;
            return format;
        };
        
        // Устанавливаем фоновое изображение
        const setCloudinaryBackground = async () => {
            const backgroundName = theme === 'dark' ? 'backgroundblack' : 'background';
            
            // Определяем формат
            const format = await detectBestFormat();

            // Получаем URL изображения в выбранном формате
            const imageUrl = getCloudinaryUrl(backgroundName, { format, quality: 90 });
            
            // Устанавливаем CSS-переменную с выбранным форматом
            document.documentElement.style.setProperty('--page-bg', `url('${imageUrl}')`);
            console.log(`Background set to ${format} format:`, imageUrl);
        };
        
        setCloudinaryBackground();
    }, [theme]);

    return (
        <Router basename={basename}>
            <div className={`${styles.app} ${styles.page}`} data-theme={theme}>
                <HomePage />
                <ThemeToggleButton />
                <VersionChecker />
            </div>
        </Router>
    );
}

export default App;