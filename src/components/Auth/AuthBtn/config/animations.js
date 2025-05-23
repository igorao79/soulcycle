/**
 * Конфигурация анимаций для компонентов кнопки авторизации
 */

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

// Анимация для меню пользователя
export const menuVariants = {
  hidden: { 
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      staggerChildren: 0.05
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { 
      duration: 0.2 
    }
  }
};

// Анимация для элементов меню
export const menuItemVariants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Анимация для иконки стрелки в меню
export const arrowVariants = {
  closed: { rotate: 0 },
  open: { rotate: 180 }
};

// Анимация для модального окна
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
}; 