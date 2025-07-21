import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { containerVariants } from './config/animations';
import { useRegisterForm } from './hooks/useRegisterForm';
import FormInput from './components/FormInput';
import SubmitButton from './components/SubmitButton';
import ErrorMessage from './components/ErrorMessage';
import FormTitle from './components/FormTitle';
import SwitchFormLink from './components/SwitchFormLink';
import styles from '../AuthForms.module.scss';

/**
 * Компонент формы регистрации, использующий подкомпоненты и useReducer через хук useRegisterForm
 */
const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const {
    email,
    password,
    confirmPassword,
    displayName,
    error,
    loading,
    setEmail,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleDisplayNameChange,
    handleSubmit
  } = useRegisterForm(onSuccess);

  return (
    <div className={styles.formContainer}>
      <FormTitle>Регистрация</FormTitle>
      
      <ErrorMessage message={error} />
      
      <motion.form 
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Поле имени пользователя */}
        <FormInput
          id="displayName"
          type="text"
          value={displayName}
          onChange={handleDisplayNameChange}
          disabled={loading}
          placeholder="Введите ваше имя (до 12 символов)"
          icon={FiUser}
          label="Имя пользователя:"
          maxLength={12}
          required
          showCharCounter
          autoComplete="username"
        />
        
        {/* Поле email */}
        <FormInput
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="Введите ваш email"
          icon={FiMail}
          label="Email:"
          required
          autoComplete="email"
        />
        
        {/* Поле пароля */}
        <FormInput
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          disabled={loading}
          placeholder="От 6 до 15 символов"
          icon={FiLock}
          label="Пароль:"
          maxLength={15}
          required
          showCharCounter
          autoComplete="new-password"
        />
        
        {/* Поле подтверждения пароля */}
        <FormInput
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={loading}
          placeholder="Повторите пароль"
          icon={FiLock}
          label="Подтвердите пароль:"
          maxLength={15}
          required
          autoComplete="new-password"
        />
        
        {/* Кнопка отправки формы */}
        <SubmitButton 
          loading={loading} 
          icon={FiUserPlus}
          loadingText="Регистрация..."
        >
          Зарегистрироваться
        </SubmitButton>
      </motion.form>
      
      {/* Ссылка для переключения между формами */}
      <SwitchFormLink
        onClick={onSwitchToLogin}
        disabled={loading}
        message="Уже есть аккаунт?"
        buttonText="Войти"
      />
    </div>
  );
};

export default RegisterForm; 