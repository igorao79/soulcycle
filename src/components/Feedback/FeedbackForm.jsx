import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FeedbackForm.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../common/Notification';
import { useFeedbackForm } from './hooks/useFeedbackForm';
import { containerVariants, itemVariants } from './config/animations';
import EmailField from './components/EmailField';
import MessageField from './components/MessageField';
import ImageUploader from './components/ImageUploader';
import SubmitButton from './components/SubmitButton';
import feedbackService from './api/feedbackService';

/**
 * Компонент формы обратной связи
 */
const FeedbackForm = () => {
  const { user } = useAuth();
  const { state, actions } = useFeedbackForm();
  const { message, images, sending, feedbackSent, error } = state;
  
  const formRef = useRef(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  /**
   * Обработчик отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.email) {
      actions.setError('Необходимо войти в аккаунт для отправки обратной связи');
      return;
    }
    
    if (!message.trim()) {
      actions.setError('Пожалуйста, введите текст сообщения');
      return;
    }
    
    try {
      actions.setSending(true);
      
      // Отправляем форму через сервис
      await feedbackService.sendFeedback(
        {
          message,
          email: user.email,
          displayName: user.displayName
        },
        images
      );
      
      // Очистка формы после отправки
      actions.resetForm();
      actions.setFeedbackSent(true);
      
      // Сбрасываем статус через 5 секунд
      setTimeout(() => {
        actions.setFeedbackSent(false);
      }, 5000);
      
    } catch (error) {
      console.error('Ошибка отправки обратной связи:', error);
      actions.setError(`Не удалось отправить сообщение: ${error.message}. Пожалуйста, попробуйте позже или свяжитесь напрямую: igoraor79@gmail.com.`);
    } finally {
      actions.setSending(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <motion.div 
        className={styles.formContainer}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        onAnimationComplete={() => setAnimationComplete(true)}
      >
        <motion.h1 
          className={styles.title}
          variants={itemVariants}
          layout
        >
          Обратная связь
        </motion.h1>
        
        <Notification 
          type="error" 
          message={error} 
          show={!!error} 
        />
        
        <Notification 
          type="success" 
          message="Ваше сообщение успешно отправлено! Спасибо за обратную связь." 
          show={feedbackSent} 
        />
        
        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Поле Email */}
          <EmailField email={user?.email} />
          
          {/* Поле сообщения */}
          <MessageField 
            value={message}
            onChange={actions.setMessage}
            disabled={sending}
          />
          
          {/* Загрузчик изображений */}
          <motion.div variants={itemVariants} layout>
            <ImageUploader 
              images={images}
              onAddImage={actions.addImage}
              onRemoveImage={actions.removeImage}
            />
          </motion.div>
          
          {/* Контейнер для кнопки */}
          <motion.div
            className={styles.buttonPlaceholder}
            style={{
              minHeight: "50px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            variants={itemVariants}
            layout
          >
            <AnimatePresence>
              {animationComplete && (
                <SubmitButton 
                  sending={sending}
                  disabled={sending || !user?.email}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackForm; 