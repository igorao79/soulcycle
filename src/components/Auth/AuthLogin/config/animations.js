/**
 * Конфигурация анимаций для компонентов формы входа
 */

// Анимация для полей ввода при фокусе
export const inputVariants = {
  focus: { scale: 1.02, x: 5 },
  blur: { scale: 1, x: 0 }
};

// Анимация для кнопок
export const buttonVariants = {
  hover: { 
    scale: 1.03,
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)" 
  },
  tap: { 
    scale: 0.98
  }
};

// Анимация для контейнера формы
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Анимация для отдельных полей формы
export const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Анимация для заголовка
export const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      delay: 0.1, 
      duration: 0.5 
    }
  }
};

// Анимация для сообщения об ошибке
export const errorVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: { 
    opacity: 1, 
    y: 0, 
    height: 'auto',
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  }
}; 