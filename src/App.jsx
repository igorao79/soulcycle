import React, { useEffect, useContext } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import styles from './App.module.css';
import HomePage from './components/HomePage';
import ThemeToggleButton from './components/theme/ThemeToggleButton';
import { ThemeContext } from './components/theme/ThemeContext';
import { getCloudinaryUrl } from './utils/cloudinary.jsx';

function App() {
    const { theme } = useContext(ThemeContext);
    
    // Устанавливаем фоновое изображение из Cloudinary
    useEffect(() => {
        const setCloudinaryBackground = () => {
            const root = document.documentElement;
            const backgroundName = theme === 'dark' ? 'backgroundblack' : 'background';
            
            // Получаем URL изображений в разных форматах
            const avifUrl = getCloudinaryUrl(backgroundName, { format: 'avif', quality: 90 });
            const webpUrl = getCloudinaryUrl(backgroundName, { format: 'webp', quality: 90 });
            const jpgUrl = getCloudinaryUrl(backgroundName, { format: 'jpg', quality: 90 });
            
            // Устанавливаем CSS-переменные
            root.style.setProperty('--page-bg-avif', `url('${avifUrl}')`);
            root.style.setProperty('--page-bg-webp', `url('${webpUrl}')`);
            root.style.setProperty('--page-bg-jpg', `url('${jpgUrl}')`);
        };
        
        setCloudinaryBackground();
    }, [theme]);

    return (
        <Router>
            <div className={styles.page}>
                <ThemeToggleButton />
                <HomePage />
            </div>
        </Router>
    );
}

export default App;