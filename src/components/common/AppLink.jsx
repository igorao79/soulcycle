import React from 'react';
import { Link } from 'react-router-dom';
import { createPath } from '../../utils/routeUtils';

const AppLink = ({ to, children, ...props }) => {
  // Создаем полный путь с учетом базового пути
  const fullPath = createPath(to);
  
  return (
    <Link to={fullPath} {...props}>
      {children}
    </Link>
  );
};

export default AppLink; 