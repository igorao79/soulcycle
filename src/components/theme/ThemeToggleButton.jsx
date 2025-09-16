import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/theme/ThemeToggleButton.module.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggleButton = React.memo(() => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const handleClick = () => {
    toggleTheme();
  };

  return (
    <button
      className={styles.themeButton}
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
    </button>
  );
});

ThemeToggleButton.displayName = 'ThemeToggleButton';

export default ThemeToggleButton;