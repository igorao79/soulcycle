import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Window from './charblock/Window';
import About from './about/About';
import UseContext from './hooks/UseContext';
import styles from '../styles/hp/HomePage.module.scss';

function HomePage() {
  return (
    <Router>
      <div className={styles.main}>
        <header className={styles.main__header}>
          <a href="/" className={styles.main__header__link}>
            <UseContext className={styles.main__header__pic}
              src="/pics/sclogo" // Базовое имя файла
              alt="Логотип"
            />
          </a>
          <h1 className={styles.main__header__title}>soul cycle</h1>
        </header>
        <nav className={styles.main__nav}>
          <ul className={styles.main__nav__perexod}>
            <li className={styles.main__nav__perexod__link}>
              <Link to="/">Главная</Link>
            </li>
            <li className={styles.main__nav__perexod__link}>
              <Link to="/characters">Персонажи</Link>
            </li>
            <li className={styles.main__nav__perexod__link}>
              <Link to="/about">О нас</Link>
            </li>
          </ul>
        </nav>
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<div></div>} />
        <Route
          path="/characters"
          element={
            <motion.div
              className={styles.characters}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Window />
            </motion.div>
          }
        />
        <Route
          path="/about"
          element={
            <motion.div
              className={styles.about}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <About />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default HomePage;