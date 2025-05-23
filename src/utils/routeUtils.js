// Получаем базовый путь в зависимости от окружения
export const getBasePath = () => {
  return import.meta.env.DEV ? '' : '/soulcycle';
};

// Функция для создания полного пути с учетом базового пути
export const createPath = (path) => {
  const basePath = getBasePath();
  // Если путь начинается с /, убираем его
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${basePath}/${cleanPath}`;
}; 