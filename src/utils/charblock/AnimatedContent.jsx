import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedContent = ({ children, direction, selectedIcon }) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      {selectedIcon && (
        <motion.div
          key={selectedIcon}
          custom={direction}
          initial={{ opacity: 0, transform: `translateX(${direction > 0 ? '20px' : '-20px'})` }}
          animate={{ opacity: 1, transform: 'translateX(0px)' }}
          exit={{ opacity: 0, transform: `translateX(${direction > 0 ? '-20px' : '20px'})` }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            willChange: 'transform, opacity', // Оптимизация для GPU
            contain: 'layout style paint' // Изоляция для предотвращения reflow
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedContent;