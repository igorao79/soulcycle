import React, { useContext } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../theme/ThemeContext';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import UseContext from '../hooks/UseContext';
import AuthButton from '../Auth/AuthBtn/AuthButton';
import styles from './StickyHeader.module.scss';

/**
 * Современный sticky header с красивыми анимациями при скролле
 */
const StickyHeader = ({ menuOpen, setMenuOpen, isActiveLink, handleNavLinkClick }) => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const { scrollY, isScrolled, isScrollingUp, isScrollingDown, isScrolling } = useScrollDirection(80);

  // Motion values для плавных анимаций
  const headerY = useMotionValue(0);
  const opacity = useTransform(scrollY, [0, 100], [0.95, 0.85]);
  const backdropBlur = useTransform(scrollY, [0, 100], [8, 20]);
  const scale = useTransform(scrollY, [0, 100], [1, 0.96]);
  const padding = useTransform(scrollY, [0, 100], [20, 12]);

  // Варианты анимаций для header
  const headerVariants = {
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    hidden: {
      y: -100,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Варианты для логотипа
  const logoVariants = {
    default: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    scrolled: {
      scale: 0.85,
      rotate: 0,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    hover: {
      scale: 1.05,
      rotate: [0, -5, 5, 0],
      transition: { 
        scale: { type: "spring", stiffness: 400, damping: 17 },
        rotate: { duration: 0.6, ease: "easeInOut" }
      }
    }
  };

  // Варианты для навигационных ссылок
  const navLinkVariants = {
    rest: { 
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    hover: { 
      scale: 1.05,
      y: -2,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    tap: { 
      scale: 0.95,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  };

  // Варианты для бургер меню
  const burgerVariants = {
    closed: {
      rotate: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    open: {
      rotate: 180,
      scale: 1.1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  // Определяем видимость header
  const shouldShow = !isScrolled || isScrollingUp || isScrolling;

  return (
    <AnimatePresence mode="wait">
      <motion.header
        className={`${styles.stickyHeader} ${isScrolled ? styles.scrolled : ''}`}
        variants={headerVariants}
        initial="visible"
        animate={shouldShow ? "visible" : "hidden"}
        style={{
          opacity,
          backdropFilter: `blur(${backdropBlur}px)`,
          scale,
        }}
        data-theme={theme}
      >
        {/* Фоновый градиент с анимацией */}
        <motion.div 
          className={styles.headerBackground}
          animate={{
            opacity: isScrolled ? 1 : 0.8,
            scale: isScrolled ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Светящийся эффект при скролле */}
        <motion.div
          className={styles.glowEffect}
          animate={{
            opacity: isScrolling ? 0.6 : 0,
            scale: isScrolling ? 1.5 : 1,
          }}
          transition={{ duration: 0.2 }}
        />

        <motion.div 
          className={styles.headerContent}
          style={{ padding }}
        >
          {/* Логотип и заголовок */}
          <motion.div className={styles.logoSection}>
            <Link to="/">
              <motion.div
                className={styles.logoContainer}
                variants={logoVariants}
                initial="default"
                animate={isScrolled ? "scrolled" : "default"}
                whileHover="hover"
                whileTap={{ scale: 0.9 }}
              >
                <UseContext 
                  src="sclogo" 
                  alt="Логотип"
                  width={isScrolled ? 40 : 50}
                  height={isScrolled ? 40 : 50}
                />
              </motion.div>
            </Link>
            
            <motion.h1 
              className={styles.headerTitle}
              animate={{
                fontSize: isScrolled ? '1.2rem' : '1.5rem',
                opacity: isScrolled ? 0.9 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              Цикл Душ
            </motion.h1>
          </motion.div>

          {/* Навигация для десктопа */}
          <motion.nav 
            className={styles.desktopNav}
            animate={{
              scale: isScrolled ? 0.95 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ul className={styles.navList}>
              {[
                { path: '/', label: 'Главная' },
                { path: '/characters', label: 'Персонажи' },
                { path: '/about', label: 'О нас' }
              ].map((item) => (
                <motion.li 
                  key={item.path}
                  className={`${styles.navItem} ${isActiveLink(item.path) ? styles.active : ''}`}
                  variants={navLinkVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link to={item.path} className={styles.navLink}>
                    <motion.span
                      className={styles.navLinkText}
                      layoutId={`nav-${item.path}`}
                    >
                      {item.label}
                    </motion.span>
                    {isActiveLink(item.path) && (
                      <motion.div
                        className={styles.activeIndicator}
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          {/* Правая секция с бургером и авторизацией */}
          <div className={styles.rightSection}>
            {/* Бургер меню */}
            <motion.button
              className={`${styles.burgerButton} ${menuOpen ? styles.open : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              variants={burgerVariants}
              animate={menuOpen ? "open" : "closed"}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span 
                className={styles.burgerLine}
                animate={{
                  rotate: menuOpen ? 45 : 0,
                  y: menuOpen ? 6 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
              <motion.span 
                className={styles.burgerLine}
                animate={{
                  opacity: menuOpen ? 0 : 1,
                  x: menuOpen ? 20 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
              <motion.span 
                className={styles.burgerLine}
                animate={{
                  rotate: menuOpen ? -45 : 0,
                  y: menuOpen ? -6 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </motion.button>

            {/* Кнопка авторизации */}
            <motion.div 
              className={styles.authSection}
              animate={{
                scale: isScrolled ? 0.9 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <AuthButton />
            </motion.div>
          </div>
        </motion.div>

        {/* Мобильное меню */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
            >
              <motion.ul className={styles.mobileNavList}>
                {[
                  { path: '/', label: 'Главная' },
                  { path: '/characters', label: 'Персонажи' },
                  { path: '/about', label: 'О нас' }
                ].map((item, index) => (
                  <motion.li
                    key={item.path}
                    className={`${styles.mobileNavItem} ${isActiveLink(item.path) ? styles.active : ''}`}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <Link 
                      to={item.path} 
                      className={styles.mobileNavLink}
                      onClick={handleNavLinkClick}
                    >
                      <motion.span
                        whileHover={{ x: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </AnimatePresence>
  );
};

export default StickyHeader; 