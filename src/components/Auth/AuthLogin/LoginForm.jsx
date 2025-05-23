import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { containerVariants } from './config/animations';
import { useLoginForm } from './hooks/useLoginForm';
import FormInput from './components/FormInput';
import SubmitButton from './components/SubmitButton';
import ErrorMessage from './components/ErrorMessage';
import FormTitle from './components/FormTitle';
import SwitchFormLink from './components/SwitchFormLink';
import ForgotPasswordLink from './components/ForgotPasswordLink';
import styles from '../AuthForms.module.scss';

/**
 * Компонент формы входа, использующий подкомпоненты и useReducer через хук useLoginForm
 */
const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const {
    email,
    password,
    error,
    loading,
    setEmail,
    setPassword,
    handleSubmit
  } = useLoginForm(onSuccess);

  return (
    <div className={styles.formContainer}>
      <FormTitle>Вход в аккаунт</FormTitle>
      
      <ErrorMessage message={error} />
      
      <motion.form 
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
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
        />
        
        {/* Поле пароля */}
        <FormInput
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="Введите ваш пароль"
          icon={FiLock}
          label="Пароль:"
          required
        />
        
        {/* Кнопка отправки формы */}
        <SubmitButton 
          loading={loading} 
          icon={FiLogIn}
          loadingText="Вход..."
        >
          Войти
        </SubmitButton>
      </motion.form>
      
      {/* Ссылка для переключения на форму регистрации */}
      <SwitchFormLink
        onClick={onSwitchToRegister}
        disabled={loading}
      />
      
      {/* Ссылка для восстановления пароля */}
      <ForgotPasswordLink disabled={loading} />
    </div>
  );
};

export default LoginForm; 