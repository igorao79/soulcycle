import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase/config';
import Window from './charblock/Window';
import About from './about/About';
import UseContext from './hooks/UseContext';
import CreatePost from './Posts/CreatePost';
import PostList from './Posts/PostList';
import styles from '../styles/hp/HomePage.module.scss';

function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.main}>
      <header className={styles.main__header}>
        <a href="/">
          <UseContext
            src="./pics/logo/sclogo" // Базовое имя файла
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
      <AnimatedRoutes user={user} loading={loading} />
    </div>
  );
}

function AnimatedRoutes({ user, loading }) {
  const location = useLocation();

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
            {!loading && <CreatePost />}
            <PostList />
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
      </Routes>
    </AnimatePresence>
  );
}

export default HomePage;