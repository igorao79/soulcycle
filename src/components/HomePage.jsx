import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import UseContext from './hooks/UseContext';
import AuthButton from './Auth/AuthBtn/AuthButton';
import PostsList from './Post/PostsList';
import styles from '../styles/hp/HomePage.module.scss';
import ThemeToggleButton from './theme/ThemeToggleButton';
import { useMobileViewport } from '../hooks/useMobileViewport';

// Lazy-loaded route components
const importWindow = () => import('./charblock/Window');
const importAbout = () => import('./about/About');
const importProfile = () => import('./Profile/ProfilePage');
const importAdmin = () => import('./Admin/AdminPanel');
const importResetPassword = () => import('./Auth/ResetPassword');
const importFeedback = () => import('./Feedback/FeedbackForm');

const Window = React.lazy(importWindow);
const About = React.lazy(importAbout);
const ProfilePage = React.lazy(importProfile);
const AdminPanel = React.lazy(importAdmin);
const ResetPassword = React.lazy(importResetPassword);
const FeedbackForm = React.lazy(importFeedback);

// Подгружаем чанки страниц в простое: тогда переход не показывает Suspense-заглушку
// и не схлопывает страницу (из-за этого раньше всё дёргалось)
const preloadRoutes = () => {
  [importWindow, importAbout, importProfile, importFeedback, importResetPassword, importAdmin]
    .forEach((load) => load().catch(() => {}));
};

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const id = window.requestIdleCallback ? window.requestIdleCallback(preloadRoutes) : setTimeout(preloadRoutes, 1500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  
  // Используем кастомный хук для работы с viewport
  const { isMobile, isCompact } = useMobileViewport();
  
  // Функция для определения активности пункта меню
  const isActiveLink = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Фиксированная навигация только на мобильных; на остальных экранах шапка — единая sticky-плашка
  useEffect(() => {
    document.body.classList.toggle('mobile-fixed-nav', isMobile);
    return () => document.body.classList.remove('mobile-fixed-nav');
  }, [isMobile]);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Получаем элементы меню и бургера
      const mobileMenu = document.querySelector(`.${styles.main__nav__mobile}`);
      const burgerButton = document.querySelector(`.${styles.main__nav__burger}`);
      
      // Проверяем, был ли клик вне меню и кнопки бургера
      if (menuOpen && mobileMenu && burgerButton && 
          !mobileMenu.contains(e.target) && 
          !burgerButton.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    // Добавляем обработчик клика на документ
    document.addEventListener('click', handleClickOutside);
    
    // Очищаем обработчик при размонтировании
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);
  
  // Закрываем меню при изменении маршрута
  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  }, [location.pathname]);

  // Блокируем скролл body при открытом меню
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Очищаем при размонтировании
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  // Закрыть меню при клике по ссылке
  const handleNavLinkClick = () => {
    setMenuOpen(false);
  };

  // Рендер фиксированной навигации через портал
  const renderFixedNav = () => {
    if (!isMobile) return null;
    
    return createPortal(
      <nav
        className={styles.main__nav__fixed}
        aria-label="Основная навигация"
      >
        {/* Логотип */}
        <motion.div 
          className={styles.main__nav__logo}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Link to="/" className={styles.main__nav__logo__link}>
            <UseContext 
              src="sclogo" 
              alt="Логотип"
            />
            <span className={styles.main__nav__logo__text}>Цикл Душ</span>
          </Link>
        </motion.div>
        
        {/* Кнопка бургера для мобильных и планшетов */}
        {isCompact && (
          <div
            className={`${styles.main__nav__burger} ${menuOpen ? styles.open : ''}`}
            role="button"
            tabIndex={0}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }
            }}
          >
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
          </div>
        )}
        
        {/* Навигация для больших экранов */}
        {!isCompact && (
          <ul className={styles.main__nav__perexod}>
            <li className={`${styles.main__nav__perexod__link} ${isActiveLink('/') ? styles.active : ''}`}>
              <Link to="/">Главная</Link>
            </li>
            <li className={`${styles.main__nav__perexod__link} ${isActiveLink('/characters') ? styles.active : ''}`}>
              <Link to="/characters">Персонажи</Link>
            </li>
            <li className={`${styles.main__nav__perexod__link} ${isActiveLink('/about') ? styles.active : ''}`}>
              <Link to="/about">О нас</Link>
            </li>
          </ul>
        )}

        {/* Профиль - используем то же состояние AuthButton */}
        <motion.div 
          className={styles.main__nav__authSlot}
          key="fixed-auth" // Уникальный ключ для фиксированного профиля
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <AuthButton />
        </motion.div>
      </nav>,
      document.body
    );
  };

  // Рендер мобильного меню через портал - НЕЗАВИСИМО ОТ СКРОЛЛА!
  const renderMobileMenu = () => {
    if (!menuOpen) return null;
    
    return createPortal(
      <div className={styles.mobileMenuOverlay} role="dialog" aria-modal="true" aria-label="Навигация">
        {/* Кнопка закрытия */}
        <div
          className={styles.mobileMenuClose}
          role="button"
          tabIndex={0}
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMenuOpen(false); } }}
        >
          ✕
        </div>
        <ul className={styles.mobileMenuList}>
          <li className={`${styles.mobileMenuItem} ${isActiveLink('/') ? styles.active : ''}`}>
            <Link to="/" onClick={handleNavLinkClick}>Главная</Link>
          </li>
          <li className={`${styles.mobileMenuItem} ${isActiveLink('/characters') ? styles.active : ''}`}>
            <Link to="/characters" onClick={handleNavLinkClick}>Персонажи</Link>
          </li>
          <li className={`${styles.mobileMenuItem} ${isActiveLink('/about') ? styles.active : ''}`}>
            <Link to="/about" onClick={handleNavLinkClick}>О нас</Link>
          </li>
          <li className={styles.mobileMenuTheme}>
            <ThemeToggleButton inline size="lg" />
          </li>
        </ul>
      </div>,
      document.body
    );
  };

  return (
    <>
      {renderFixedNav()}
      {renderMobileMenu()}
      <div className={styles.main}>
        {/* Единая sticky-плашка: логотип — навигация — профиль (на мобильных вместо неё fixed-навигация) */}
        {!isMobile && (
        <nav className={`${styles.main__nav} ${styles.main__nav__bar}`}>
          <Link to="/" className={styles.main__header} aria-label="Цикл Душ — на главную">
            <UseContext src="sclogo" alt="Логотип" />
            <span className={styles.main__header__title}>Цикл Душ</span>
          </Link>
        {!isCompact && (
          <ul className={styles.main__nav__perexod}>
            <li className={`${styles.main__nav__perexod__link} ${isActiveLink('/') ? styles.active : ''}`}>
              <Link to="/">Главная</Link>
            </li>
            <li className={`${styles.main__nav__perexod__link} ${isActiveLink('/characters') ? styles.active : ''}`}>
              <Link to="/characters">Персонажи</Link>
            </li>
            <li className={`${styles.main__nav__perexod__link} ${isActiveLink('/about') ? styles.active : ''}`}>
              <Link to="/about">О нас</Link>
            </li>
          </ul>
        )}
        
        {/* Кнопка гамбургер-меню: на планшетах до скролла, на мобильных рендерится во fixed-nav */}
        {isCompact && !isMobile && (
          <div
            className={`${styles.main__nav__burger} ${menuOpen ? styles.open : ''}`}
            role="button"
            tabIndex={0}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }
            }}
          >
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
          </div>
        )}
        
        {/* Мобильное меню рендерится через портал */}
        
        {/* Кнопка авторизации - скрываем при скролле и не дублируем на мобильных */}
          <div className={styles.main__nav__auth}>
            <AuthButton />
          </div>
          {!isCompact && <ThemeToggleButton inline />}
        </nav>
        )}
      <AnimatedRoutes />
    </div>
    </>
  );
}

// Только opacity: смещение по y сдвигало содержимое и давало дерганье при смене страниц
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Общая анимация появления/ухода страницы
function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Suspense fallback={<div className={styles.routeArea} />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className={styles.routeArea}>
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <div className={styles.homepage}>
              <PostsList />
            </div>
          </PageTransition>
        } />
        <Route path="/characters" element={
          <PageTransition>
            <Window />
          </PageTransition>
        } />
        <Route path="/about" element={
          <PageTransition>
            <About />
          </PageTransition>
        } />
        <Route path="/profile" element={
          <PageTransition>
            <ProfilePage />
          </PageTransition>
        } />
        <Route path="/profile/:userId" element={
          <PageTransition>
            <ProfilePage />
          </PageTransition>
        } />
        <Route path="/reset-password" element={
          <PageTransition>
            <ResetPassword />
          </PageTransition>
        } />
        <Route path="/admin" element={
          <PageTransition>
            <AdminPanel />
          </PageTransition>
        } />
        <Route path="/feedback" element={
          <PageTransition>
            <FeedbackForm />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
    </div>
  );
}

export default HomePage;