import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import AuthButton from './Auth/AuthBtn/AuthButton';
import PostsList from './Post/PostsList';
import styles from '../styles/hp/HomePage.module.scss';
import ThemeToggleButton from './theme/ThemeToggleButton';
import { useMobileViewport } from '../hooks/useMobileViewport';

// Lazy-loaded route components
const Window = React.lazy(() => import('./charblock/Window'));
const About = React.lazy(() => import('./about/About'));
const UseContext = React.lazy(() => import('./hooks/UseContext'));
const ProfilePage = React.lazy(() => import('./Profile/ProfilePage'));
const AdminPanel = React.lazy(() => import('./Admin/AdminPanel'));
const ResetPassword = React.lazy(() => import('./Auth/ResetPassword'));
const FeedbackForm = React.lazy(() => import('./Feedback/FeedbackForm'));

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  // Используем кастомный хук для работы с viewport
  const { isMobile, isCompact } = useMobileViewport();
  
  // Состояние для фиксированной навигации
  const [showFixedNav, setShowFixedNav] = useState(isMobile);

  // Функция для определения активности пункта меню
  const isActiveLink = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Обработчик скролла для анимации навигации
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          
          // Используем разный порог в зависимости от страницы
          const isCharactersPage = location.pathname === '/characters';
          const threshold = isCharactersPage ? 5 : 70; // Минимальный порог для страницы персонажей
          const shouldScroll = scrollPosition > threshold;
          // На мобильных не применяем состояние скролла для скрытия хедера
          setIsScrolled(!isMobile && shouldScroll);
          // На мобильных фиксированная навигация всегда включена
          setShowFixedNav(shouldScroll || isMobile);
          
          // Добавляем класс для мобильной и планшетной фиксированной навигации
          if (isMobile || (isCompact && shouldScroll)) {
            document.body.classList.add('mobile-fixed-nav');
          } else {
            document.body.classList.remove('mobile-fixed-nav');
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    const handleResize = () => {
      // При изменении размера окна пересчитываем
      handleScroll();
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Проверяем сразу при загрузке
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('mobile-fixed-nav');
    };
  }, [isMobile, isCompact, location.pathname]);

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

  // Обработчик смены темы без закрытия меню
  const handleThemeToggle = (e) => {
    e.stopPropagation();
    // Здесь не закрываем меню
  };



  // Рендер фиксированной навигации через портал
  const renderFixedNav = () => {
    if (!showFixedNav) return null;
    
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
            {/* Показываем текст только на планшетах и больше */}
            {!isMobile && (
              <span className={styles.main__nav__logo__text}>Цикл Душ</span>
            )}
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
            <div onClick={handleThemeToggle}>
              <ThemeToggleButton />
            </div>
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
      <div className={`${styles.main} ${isScrolled ? styles.scrolled : ''}`}>
        {!isMobile && (
          <header className={`${styles.main__header} ${isScrolled ? styles.hidden : ''}`}>
            <Link to="/">
              <UseContext 
                src="sclogo" 
                alt="Логотип"
              />
            </Link>
            <h1 className={styles.main__header__title}>Цикл Душ</h1>
          </header>
        )}
        <nav className={styles.main__nav}>
        {/* Стандартная навигация для десктопа - скрываем при скролле */}
        {!isScrolled && !isCompact && (
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
        {!isScrolled && (isCompact && !isMobile) && (
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
        {!isScrolled && !isMobile && (
          <div className={styles.main__nav__auth}>
            <AuthButton />
          </div>
        )}
      </nav>
      <Suspense fallback={<div className={styles.homepage} style={{ minHeight: '50vh' }} />}>
        <AnimatedRoutes />
      </Suspense>
    </div>
    </>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

// Общая анимация появления/ухода страницы
function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
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
  );
}

export default HomePage;