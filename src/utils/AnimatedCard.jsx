import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ children, direction, selectedIcon }) => (
  <motion.div
    key={selectedIcon}
    custom={direction}
    initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
    transition={{ duration: 0.3 }}
    layout // Это свойство помогает поддерживать размеры
    style={{ width: '100%', height: '100%' }} // Убедитесь, что размеры остаются фиксированными
  >
    {children}
  </motion.div>
);

export default AnimatedCard;
