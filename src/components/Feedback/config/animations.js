/**
 * Варианты анимации для формы обратной связи
 */

// Анимация контейнера формы
export const containerVariants = {
  hidden: { 
    opacity: 0
  },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      ease: "easeInOut",
      when: "beforeChildren", 
      staggerChildren: 0.15
    }
  }
};

// Анимация элементов формы
export const itemVariants = {
  hidden: { 
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)"
  },
  tap: { scale: 0.98 }
};

// Анимация кнопки отправки
export const buttonVariants = {
  hidden: { 
    opacity: 0,
    y: 10,
    scale: 0.9
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.4,
      delay: 0.2,
      ease: "easeOut"
    }
  },
  hover: { 
    scale: 1.04,
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.15)",
    transition: {
      duration: 0.2
    }
  },
  tap: { scale: 0.98 }
};

// Анимация изображений
export const imageVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3 
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

// Анимация контейнера изображений
export const imageContainerVariants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.4 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.3 
    }
  }
}; 