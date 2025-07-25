import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Window from './charblock/Window';
import About from './about/About';
import UseContext from './hooks/UseContext';
import AuthButton from './Auth/AuthBtn/AuthButton';
import ProfilePage from './Profile/ProfilePage';
import PostsList from './Post/PostsList';
import AdminPanel from './Admin/AdminPanel';
import ResetPassword from './Auth/ResetPassword';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/hp/HomePage.module.scss';
import FeedbackForm from './Feedback/FeedbackForm';
import ThemeToggleButton from './theme/ThemeToggleButton';
import { useMobileViewport } from '../hooks/useMobileViewport';

function HomePage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  const isAdmin = user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );

  // Используем кастомный хук для работы с viewport
  const { viewportHeight, viewportWidth, isMobile } = useMobileViewport();
  
  // Состояние для фиксированной навигации
  const [showFixedNav, setShowFixedNav] = useState(false);

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
          setIsScrolled(shouldScroll);
          setShowFixedNav(shouldScroll);
          
          // Добавляем класс для мобильной и планшетной фиксированной навигации
          if ((isMobile || viewportWidth <= 1024) && shouldScroll) {
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
  }, [isMobile, viewportWidth, location.pathname]);

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
        style={{
          position: 'fixed',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: 'calc(100% - 40px)',
          maxWidth: '1200px',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '25px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Логотип */}
        <motion.div 
          className={styles.main__nav__logo}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <UseContext 
              src="sclogo" 
              alt="Логотип"
            />
            {/* Показываем текст только на планшетах и больше */}
            {!isMobile && (
              <span style={{ 
                fontSize: '1.4rem', 
                fontWeight: '600', 
                color: 'var(--text-color)' 
              }}>Цикл Душ</span>
            )}
          </Link>
        </motion.div>
        
        {/* Кнопка бургера для мобильных и планшетов */}
        {(isMobile || viewportWidth <= 1024) && (
          <div 
            className={`${styles.main__nav__burger} ${menuOpen ? styles.open : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
          </div>
        )}
        
        {/* Навигация для больших экранов */}
        {viewportWidth > 1024 && (
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
      <div className={styles.mobileMenuOverlay}>
        {/* Кнопка закрытия */}
        <div className={styles.mobileMenuClose} onClick={() => setMenuOpen(false)}>
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
        <header className={`${styles.main__header} ${isScrolled ? styles.hidden : ''}`}>
          <Link to="/">
            <UseContext 
              src="sclogo" 
              alt="Логотип"
            />
          </Link>
          <h1 className={styles.main__header__title}>Цикл Душ</h1>
        </header>
        <nav className={styles.main__nav}>
        {/* Стандартная навигация для десктопа - скрываем при скролле */}
        {!isScrolled && viewportWidth > 1024 && (
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
        
        {/* Кнопка гамбургер-меню только для мобильных и планшетов при отсутствии скролла */}
        {!isScrolled && (isMobile || viewportWidth <= 1024) && (
          <div 
            className={`${styles.main__nav__burger} ${menuOpen ? styles.open : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
            <div className={styles.main__nav__burger__line}></div>
          </div>
        )}
        
        {/* Мобильное меню рендерится через портал */}
        
        {/* Кнопка авторизации - скрываем при скролле */}
        {!isScrolled && (
          <div className={styles.main__nav__auth}>
            <AuthButton />
          </div>
        )}
      </nav>
      <AnimatedRoutes />
    </div>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.homepage}>
              <PostsList />
            </div>
          </motion.div>
        } />
        <Route path="/characters" element={
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Window />
          </motion.div>
        } />
        <Route path="/about" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <About />
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProfilePage />
          </motion.div>
        } />
        <Route path="/profile/:userId" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProfilePage />
          </motion.div>
        } />
        <Route path="/reset-password" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ResetPassword />
          </motion.div>
        } />
        <Route path="/admin" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPanel />
          </motion.div>
        } />
        <Route path="/feedback" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FeedbackForm />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default HomePage;