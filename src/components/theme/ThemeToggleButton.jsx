import React, { useContext, useCallback, useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import styles from '../../styles/theme/ThemeToggleButton.module.css';
import { getCloudinaryUrl } from '../../utils/cloudinary.jsx';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggleButton = React.memo(() => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [ripple, setRipple] = useState(null);
  const [isCooling, setIsCooling] = useState(false);
  const currentWaveIdRef = React.useRef(0);
  const themeTimeoutRef = React.useRef(null);
  const cleanupTimeoutRef = React.useRef(null);
  const cooldownUntilRef = React.useRef(0);

  const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name)?.trim();

  const hexToRgb = (hex) => {
    const h = hex.replace('#','');
    const m = h.length === 3
      ? h.split('').map((c) => parseInt(c + c, 16))
      : [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
    return { r: m[0], g: m[1], b: m[2] };
  };

  const getNextThemeGradient = useCallback(() => {
    const nextTheme = isDark ? 'light' : 'dark';
    const accent = getCssVar('--accent-color') || '#3498db';
    let rgb;
    if (accent.startsWith('#')) {
      rgb = hexToRgb(accent);
    } else if (accent.startsWith('rgb')) {
      const m = accent.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      rgb = m ? { r: parseInt(m[1],10), g: parseInt(m[2],10), b: parseInt(m[3],10) } : { r: 52, g: 152, b: 219 };
    } else {
      rgb = { r: 52, g: 152, b: 219 };
    }
    const a0 = nextTheme === 'dark' ? 0.22 : 0.16;
    const a1 = nextTheme === 'dark' ? 0.18 : 0.12;
    const a2 = nextTheme === 'dark' ? 0.12 : 0.08;
    return `radial-gradient(circle at center, rgba(${rgb.r},${rgb.g},${rgb.b},${a0}) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},${a1}) 45%, rgba(${rgb.r},${rgb.g},${rgb.b},${a2}) 70%, rgba(${rgb.r},${rgb.g},${rgb.b},0) 100%)`;
  }, [isDark]);

  const getPrevThemeBgColor = useCallback(() => {
    return isDark ? '#1a1a1a' : '#ffffff';
  }, [isDark]);

  const getNextBackgroundUrl = useCallback(() => {
    const nextName = isDark ? 'background' : 'backgroundblack';
    return getCloudinaryUrl(nextName, { quality: 90, fetch_format: 'auto' });
  }, [isDark]);

  const handleClick = useCallback(async (e) => {
    // Простая блокировка через время
    const now = Date.now();
    if (now < cooldownUntilRef.current) return;

    // Инвалидация предыдущей волны
    currentWaveIdRef.current += 1;
    const waveId = currentWaveIdRef.current;
    
    // Очистка старых таймеров
    if (themeTimeoutRef.current) clearTimeout(themeTimeoutRef.current);
    if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
    
    // Сбрасываем предыдущие слои
    setRipple(null);
    
    // Ставим блокировку: волна (~650ms) + перезарядка (3000ms)
    const totalLock = 650 + 3000;
    cooldownUntilRef.current = now + totalLock;
    setIsCooling(true);
    setTimeout(() => setIsCooling(false), totalLock);

    const x = e.clientX;
    const y = e.clientY;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const distances = [
      Math.hypot(x, y),
      Math.hypot(w - x, y),
      Math.hypot(x, h - y),
      Math.hypot(w - x, h - y)
    ];
    const maxR = Math.max(...distances);

    const gradient = getNextThemeGradient();
    const color = getPrevThemeBgColor();
    const key = Date.now();

    window.requestAnimationFrame(() => {
      const nextBg = getNextBackgroundUrl();
      setRipple({ x, y, scale: (maxR / 50) * 2, gradient, color, radius: maxR, key, nextBg });
      
      // Переключаем тему в середине анимации
      themeTimeoutRef.current = setTimeout(() => {
        if (currentWaveIdRef.current !== waveId) return;
        toggleTheme();
      }, 325);
    });
  }, [getNextThemeGradient, getPrevThemeBgColor, getNextBackgroundUrl, toggleTheme]);

  return (
    <button
      className={`${styles.themeButton} ${isCooling ? styles.disabled : ''}`}
      onClick={handleClick}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        className={styles.toggleInner}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        animate={{
          background: isDark
            ? 'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 100%)'
            : 'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
          boxShadow: isDark
            ? 'inset 0 0 20px rgba(255,255,255,0.08), 0 10px 25px rgba(0,0,0,0.35)'
            : 'inset 0 0 20px rgba(255,255,255,0.3), 0 10px 25px rgba(0,0,0,0.12)'
        }}
      >
        {/* Световое свечение/метеоры */}
        <motion.span
          className={styles.glow}
          key={isDark ? 'glow-dark' : 'glow-light'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Иконки: Солнце/Луна */}
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              className={styles.icon}
              initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <FaSun color="#000" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              className={styles.icon}
              initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <FaMoon color="#fff" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Wave overlay через портал */}
      {ripple && createPortal(
        (
          <motion.div
            key={ripple.key}
            className={styles.waveOverlay}
            style={{ 
              backgroundImage: ripple.nextBg ? `url(${ripple.nextBg})` : undefined,
              backgroundColor: ripple.nextBg ? undefined : ripple.color,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            initial={{ clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)`, opacity: 1 }}
            animate={{ clipPath: `circle(${ripple.radius + 40}px at ${ripple.x}px ${ripple.y}px)`, opacity: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            onAnimationComplete={() => {
              if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
              setRipple(null);
            }}
          />
        ),
        document.getElementById('bg-effects-root') || document.body
      )}
    </button>
  );
});

ThemeToggleButton.displayName = 'ThemeToggleButton';

export default ThemeToggleButton;