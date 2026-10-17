import { useSyncExternalStore } from 'react';

/**
 * Подписка на media query. Компонент перерисовывается только при пересечении
 * брейкпоинта, а не на каждый resize (в отличие от window.innerWidth в state).
 */
export const useMediaQuery = (query) => {
  const subscribe = (callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
};
