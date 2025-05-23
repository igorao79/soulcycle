import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import AppLink from './common/AppLink';

function HomePage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isAdmin = user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );

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
  const location = useLocation();
  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  }, [location.pathname]);

  // Закрыть меню при клике по ссылке
  const handleNavLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className={styles.main}>
      <header className={styles.main__header}>
        <AppLink to="/">
          <UseContext 
            src="sclogo" 
            alt="Логотип"
          />
        </AppLink>
        <h1 className={styles.main__header__title}>Цикл Душ</h1>
      </header>
      <nav className={styles.main__nav}>
        {/* Стандартная навигация для десктопа */}
        <ul className={styles.main__nav__perexod}>
          <li className={styles.main__nav__perexod__link}>
            <AppLink to="/">Главная</AppLink>
          </li>
          <li className={styles.main__nav__perexod__link}>
            <AppLink to="/characters">Персонажи</AppLink>
          </li>
          <li className={styles.main__nav__perexod__link}>
            <AppLink to="/about">О нас</AppLink>
          </li>
        </ul>
        
        {/* Кнопка гамбургер-меню */}
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
        
        {/* Мобильное меню (выпадающее) */}
        <div className={`${styles.main__nav__mobile} ${menuOpen ? styles.open : ''}`}>
          <ul className={styles.main__nav__mobile__list}>
            <li className={styles.main__nav__mobile__list__item}>
              <AppLink to="/" onClick={handleNavLinkClick}>Главная</AppLink>
            </li>
            <li className={styles.main__nav__mobile__list__item}>
              <AppLink to="/characters" onClick={handleNavLinkClick}>Персонажи</AppLink>
            </li>
            <li className={styles.main__nav__mobile__list__item}>
              <AppLink to="/about" onClick={handleNavLinkClick}>О нас</AppLink>
            </li>
          </ul>
        </div>
        
        <div className={styles.main__nav__auth}>
          <AuthButton />
        </div>
      </nav>
      <AnimatedRoutes />
    </div>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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