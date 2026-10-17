import { useMediaQuery } from './useMediaQuery';

/**
 * Брейкпоинты интерфейса: isMobile — до 768px, isCompact — до 1024px (мобильные и планшеты).
 * Высота viewport в CSS задаётся через 100dvh (App.module.css), поэтому здесь не нужно
 * слушать resize — иначе адресная строка мобильного браузера вызывает перерисовку страницы
 * и дерганье при скролле.
 */
export const useMobileViewport = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isCompact = useMediaQuery('(max-width: 1024px)');

  return { isMobile, isCompact };
};
