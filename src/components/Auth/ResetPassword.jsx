import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabaseClient';
import styles from './ResetPassword.module.scss';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Извлекаем токен из URL
    const hashParams = window.location.hash.substring(1).split('&').reduce((acc, item) => {
      const [key, value] = item.split('=');
      acc[key] = value;
      return acc;
    }, {});

    console.log('Параметры URL:', hashParams);

    // Если есть токен доступа, сохраняем его
    if (hashParams.access_token) {
      console.log('Найден токен доступа в URL');
      setAccessToken(hashParams.access_token);
      
      // Устанавливаем сессию Supabase с полученным токеном
      const setSession = async () => {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: hashParams.access_token,
            refresh_token: hashParams.refresh_token || ''
          });
          
          if (error) {
            console.error('Ошибка при установке сессии:', error);
            setMessage({
              type: 'error',
              text: 'Ошибка при аутентификации: ' + error.message
            });
          } else {
            console.log('Сессия успешно установлена:', data);
            setMessage({
              type: 'info',
              text: 'Введите новый пароль'
            });
          }
        } catch (e) {
          console.error('Исключение при установке сессии:', e);
        }
      };
      
      setSession();
    } else {
      setMessage({
        type: 'error',
        text: 'Ссылка недействительна. Запросите новую ссылку для сброса пароля.'
      });
    }
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Пароли не совпадают'
      });
      return;
    }
    
    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Пароль должен содержать не менее 6 символов'
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage({
        type: 'info',
        text: 'Обновление пароля...'
      });
      
      console.log('Отправка запроса на обновление пароля');
      
      // Обновляем пароль пользователя
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error('Ошибка при обновлении пароля:', error);
        throw error;
      }
      
      console.log('Пароль успешно обновлен:', data);
      
      // Выходим из системы, чтобы пользователь заново вошел с новым паролем
      await supabase.auth.signOut();
      
      setMessage({
        type: 'success',
        text: 'Пароль успешно обновлен! Переход на страницу входа...'
      });
      
      // Перенаправляем на главную страницу после успешного обновления
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Произошла ошибка при обновлении пароля'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.resetContainer}>
      <div className={styles.resetCard}>
        <h2>Сброс пароля</h2>
        
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleReset} className={styles.resetForm}>
          <div className={styles.formGroup}>
            <label htmlFor="password">Новый пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !accessToken}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || !accessToken}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.resetButton}
            disabled={loading || !accessToken}
          >
            {loading ? 'Обновление...' : 'Обновить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 