import React, { useState, useEffect, useRef } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import useUserRole from '../../hooks/useUserRole';
import { initUserSync } from '../../firebase/syncUsers';
import UserName from '../User/UserName';
import UserPrivileges from '../User/UserPrivileges';
import './AuthForm.css';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { isAdmin } = useUserRole(user?.uid);

  useEffect(() => {
    // Инициализируем синхронизацию пользователей
    initUserSync();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setNickname(currentUser.displayName);
      }
    });

    // Закрытие меню при клике вне его
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Отслеживаем изменения данных пользователя
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          setUserData(null);
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setUserData(null);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isEarlyUser = (creationTime) => {
    if (!creationTime) return false;
    const userDate = new Date(creationTime);
    const siteLaunchDate = new Date('2024-04-10'); // Установите здесь дату запуска вашего сайта
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    return userDate.getTime() - siteLaunchDate.getTime() <= oneWeekInMs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: nickname
        });
        // Создаем запись в Firestore для нового пользователя
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          displayName: nickname,
          createdAt: new Date().toISOString(),
          isAdmin: false // По умолчанию новый пользователь не админ
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (user) {
    const isEarly = isEarlyUser(user.metadata.creationTime);
    return (
      <div className="auth-container" ref={menuRef}>
        <div className="user-icon" onClick={toggleMenu}>
          {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
        </div>
        {isOpen && (
          <div className="auth-form">
            <div className="profile-info">
              <div className="nickname-container">
                <UserName 
                  userId={user.uid} 
                  nickname={user.displayName || 'Пользователь'} 
                />
              </div>
              <p className="profile-email">{user.email}</p>
              <p className="profile-date">Зарегистрирован: {formatDate(user.metadata.creationTime)}</p>
              {isAdmin && (
                <p className="admin-status">Статус: Администратор</p>
              )}
              
              <div className="privileges-section">
                <UserPrivileges userId={user.uid} />
              </div>
            </div>
            <button onClick={handleSignOut} className="sign-out-button">
              Выйти
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-container" ref={menuRef}>
      <div className="auth-icon" onClick={toggleMenu}>
        👤
      </div>
      {isOpen && (
        <div className="auth-form">
          <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Ник"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
          <button 
            className="toggle-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthForm; 