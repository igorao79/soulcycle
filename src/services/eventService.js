import supabase from './supabaseClient';

// Local storage key for site events cache - must match the one in useSiteEvents
const SITE_EVENTS_CACHE_KEY = 'site_events_cache';

// In-memory cache to avoid repeated lookups
let eventsCache = null;

// Initialize event listener for site events changes
(() => {
  try {
    // Try to load cache from localStorage on module initialization
    const cachedEvents = localStorage.getItem(SITE_EVENTS_CACHE_KEY);
    if (cachedEvents) {
      eventsCache = JSON.parse(cachedEvents);
      console.log('EventService: Loaded initial events cache from localStorage:', eventsCache);
    }
    
    // Add event listener for site events changes
    window.addEventListener('siteEventsChanged', (event) => {
      if (event.detail && event.detail.siteEvents) {
        eventsCache = event.detail.siteEvents;
        console.log('EventService: Updated events cache from event:', eventsCache);
      }
    });
    
    // Add event listener for storage changes (cross-tab)
    window.addEventListener('storage', (event) => {
      if (event.key === SITE_EVENTS_CACHE_KEY && event.newValue) {
        try {
          eventsCache = JSON.parse(event.newValue);
          console.log('EventService: Updated events cache from storage event:', eventsCache);
        } catch (error) {
          console.error('EventService: Error parsing events from storage event:', error);
        }
      }
    });
  } catch (error) {
    console.error('EventService: Error initializing events cache:', error);
  }
})();

/**
 * Проверяет, активно ли указанное событие на сайте
 * @param {string} eventName - Название события (в camelCase)
 * @returns {Promise<boolean>} - Активно ли событие
 */
export const isEventActive = async (eventName) => {
  try {
    // First check the in-memory cache
    if (eventsCache && eventsCache[eventName] !== undefined) {
      console.log(`EventService: Using cached value for ${eventName}:`, eventsCache[eventName]);
      return eventsCache[eventName];
    }
    
    // Then check localStorage
    try {
      const cachedEvents = localStorage.getItem(SITE_EVENTS_CACHE_KEY);
      if (cachedEvents) {
        const events = JSON.parse(cachedEvents);
        if (events && events[eventName] !== undefined) {
          // Update in-memory cache
          eventsCache = events;
          console.log(`EventService: Using localStorage value for ${eventName}:`, events[eventName]);
          return events[eventName];
        }
      }
    } catch (localStorageError) {
      console.error('EventService: Error reading from localStorage:', localStorageError);
    }
    
    // If not in cache, query the database
    console.log(`EventService: Querying database for event ${eventName}`);
    
    // Преобразуем имя события из camelCase в snake_case для базы данных
    const dbEventName = eventName === 'earlyUserPromotion' 
      ? 'early_user_promotion' 
      : eventName.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Получаем настройки сайта
    const { data, error } = await supabase
      .from('site_settings')
      .select(dbEventName)
      .single();
    
    if (error) {
      console.error('EventService: Error checking event activity:', error);
      return false;
    }
    
    const isActive = data ? Boolean(data[dbEventName]) : false;
    
    // Update in-memory cache with the new value
    eventsCache = { ...eventsCache, [eventName]: isActive };
    
    // Also update localStorage cache
    try {
      const existingCache = localStorage.getItem(SITE_EVENTS_CACHE_KEY);
      const cacheObj = existingCache ? JSON.parse(existingCache) : {};
      cacheObj[eventName] = isActive;
      localStorage.setItem(SITE_EVENTS_CACHE_KEY, JSON.stringify(cacheObj));
    } catch (updateError) {
      console.error('EventService: Error updating localStorage cache:', updateError);
    }
    
    return isActive;
  } catch (error) {
    console.error('EventService: Error checking event activity:', error);
    return false;
  }
};

/**
 * Обрабатывает назначение перков на основе активных событий при регистрации
 * @param {string} userId - ID пользователя
 * @returns {Promise<string[]>} - Массив перков, которые были добавлены
 */
export const processEventPerksForNewUser = async (userId) => {
  try {
    // Массив добавленных перков
    const addedPerks = [];
    
    // Проверяем активность события earlyUserPromotion
    const isEarlyUserPromotionActive = await isEventActive('earlyUserPromotion');
    
    if (isEarlyUserPromotionActive) {
      // Добавляем перк early_user
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('perks')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Ошибка при получении перков пользователя:', error);
        return addedPerks;
      }
      
      // Если у пользователя уже есть перки, добавляем к ним early_user
      // Иначе создаем новый массив с перками user и early_user
      const currentPerks = profileData?.perks || ['user'];
      
      // Проверяем, есть ли уже перк early_user
      if (!currentPerks.includes('early_user')) {
        const newPerks = [...currentPerks, 'early_user'];
        
        // Обновляем профиль пользователя
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ perks: newPerks })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Ошибка при обновлении перков пользователя:', updateError);
        } else {
          addedPerks.push('early_user');
        }
      }
    }
    
    return addedPerks;
  } catch (error) {
    console.error('Ошибка при обработке перков события:', error);
    return [];
  }
};

export default {
  isEventActive,
  processEventPerksForNewUser
}; 