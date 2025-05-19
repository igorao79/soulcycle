import { useState, useRef, useEffect } from 'react';
import supabase from '../../../services/supabaseClient';
import { SUPER_ADMIN_EMAIL } from '../../../services/auth/authCore';

// Local storage key for site events cache
const SITE_EVENTS_CACHE_KEY = 'site_events_cache';

export const useSiteEvents = (user, setTemporaryMessage) => {
  // Initialize from localStorage if available, otherwise use default values
  const initialEvents = () => {
    try {
      const cachedEvents = localStorage.getItem(SITE_EVENTS_CACHE_KEY);
      if (cachedEvents) {
        console.log('Loaded site events from localStorage:', JSON.parse(cachedEvents));
        return JSON.parse(cachedEvents);
      }
    } catch (error) {
      console.error('Error reading site events from localStorage:', error);
    }
    return { earlyUserPromotion: false };
  };

  const [siteEvents, setSiteEvents] = useState(initialEvents);
  const [eventsLoading, setEventsLoading] = useState(false);
  const isLoadingRef = useRef(false); // Ref to prevent concurrent calls
  const hasInitializedRef = useRef(false); // Prevent multiple initializations
  
  // Update localStorage whenever site events change
  useEffect(() => {
    try {
      console.log('Saving site events to localStorage:', siteEvents);
      localStorage.setItem(SITE_EVENTS_CACHE_KEY, JSON.stringify(siteEvents));
      
      // Dispatch a custom event to notify other components that site events have changed
      const siteEventsChangeEvent = new CustomEvent('siteEventsChanged', { 
        detail: { siteEvents } 
      });
      window.dispatchEvent(siteEventsChangeEvent);
      console.log('Dispatched siteEventsChanged event:', siteEvents);
    } catch (error) {
      console.error('Error storing site events in localStorage:', error);
    }
  }, [siteEvents]);
  
  // Set up event listener for siteEventsChanged events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === SITE_EVENTS_CACHE_KEY && e.newValue) {
        try {
          const newEvents = JSON.parse(e.newValue);
          console.log('Storage event detected, updating site events:', newEvents);
          setSiteEvents(newEvents);
        } catch (error) {
          console.error('Error parsing site events from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load site events from database
  const loadSiteEvents = async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      console.log('Already loading site events, skipping...');
      return;
    }
    
    console.log('Loading site events from database...');
    try {
      isLoadingRef.current = true;
      setEventsLoading(true);
      
      try {
        // Simple query for one record
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .limit(1);
        
        console.log('Site settings query result:', { data, error });
        
        if (error) {
          console.error('Error querying site_settings:', error);
          
          // Try to create the table if it doesn't exist
          try {
            console.log('Attempting to create site_settings table...');
            await supabase.rpc('create_site_settings_if_not_exists');
          } catch (rpcError) {
            console.error('Failed to create settings table:', rpcError);
          }
          
          // Create a settings record
          try {
            console.log('Attempting to create initial site settings record...');
            await supabase
              .from('site_settings')
              .insert({
                early_user_promotion: siteEvents.earlyUserPromotion || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          } catch (insertError) {
            console.error('Failed to insert settings:', insertError);
          }
        } else if (!data || data.length === 0) {
          // No records exist, create one with current state from localStorage
          try {
            console.log('No site settings found, creating initial record...');
            await supabase
              .from('site_settings')
              .insert({
                early_user_promotion: siteEvents.earlyUserPromotion || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            console.log('Created new site settings with state:', siteEvents);
          } catch (insertError) {
            console.error('Failed to insert settings:', insertError);
          }
        } else {
          // Use the first record found
          const updatedEvents = {
            earlyUserPromotion: data[0].early_user_promotion || false
          };
          
          console.log('Loaded site events from DB:', updatedEvents);
          setSiteEvents(updatedEvents);
          
          // Update localStorage cache
          localStorage.setItem(SITE_EVENTS_CACHE_KEY, JSON.stringify(updatedEvents));
          
          // Dispatch event for cross-component communication
          const siteEventsChangeEvent = new CustomEvent('siteEventsChanged', { 
            detail: { siteEvents: updatedEvents } 
          });
          window.dispatchEvent(siteEventsChangeEvent);
          console.log('Dispatched siteEventsChanged event after DB load:', updatedEvents);
        }
      } catch (err) {
        console.error('Error handling site_settings:', err);
      }
      
      // Mark as initialized to prevent future calls
      hasInitializedRef.current = true;
    } finally {
      setEventsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Toggle site event
  const toggleSiteEvent = async (eventName) => {
    if (isLoadingRef.current) {
      console.log('Already processing site events, skipping toggle...');
      return;
    }
    
    try {
      // Check admin rights
      const isUserAdmin = user && (
        user.email === SUPER_ADMIN_EMAIL || 
        user.perks?.includes('admin') || 
        user.activePerk === 'admin'
      );
      
      if (!isUserAdmin) {
        setTemporaryMessage({
          type: 'error',
          text: 'Только администраторы могут управлять событиями сайта'
        });
        return;
      }
      
      isLoadingRef.current = true;
      setEventsLoading(true);
      
      // Toggle event state
      const newValue = !siteEvents[eventName];
      console.log(`Toggling ${eventName} from ${siteEvents[eventName]} to ${newValue}`);
      
      // Format event name for DB (camelCase to snake_case)
      let dbEventName = eventName === 'earlyUserPromotion' 
        ? 'early_user_promotion' 
        : eventName.replace(/([A-Z])/g, '_$1').toLowerCase();
        
      try {
        // Get the first record or create one if none exists
        const { data, error } = await supabase
          .from('site_settings')
          .select('id')
          .limit(1);
        
        if (error || !data || data.length === 0) {
          // Create a new settings record
          console.log('No settings record found, creating new one with:', { [dbEventName]: newValue });
          await supabase
            .from('site_settings')
            .insert({
              [dbEventName]: newValue,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          console.log('Created new site settings record with', dbEventName, '=', newValue);
        } else {
          // Update the first record
          console.log('Updating existing settings record:', data[0].id, 'with', { [dbEventName]: newValue });
          const updateResult = await supabase
            .from('site_settings')
            .update({ 
              [dbEventName]: newValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', data[0].id);
            
          console.log('Updated site settings result:', updateResult);
        }
        
        // Update local state immediately
        const updatedEvents = {
          ...siteEvents,
          [eventName]: newValue
        };
        
        console.log('Updating site events to:', updatedEvents);
        setSiteEvents(updatedEvents);
        
        // Update localStorage cache immediately
        localStorage.setItem(SITE_EVENTS_CACHE_KEY, JSON.stringify(updatedEvents));
        
        // Dispatch event for cross-component communication
        const siteEventsChangeEvent = new CustomEvent('siteEventsChanged', { 
          detail: { siteEvents: updatedEvents } 
        });
        window.dispatchEvent(siteEventsChangeEvent);
        
        setTemporaryMessage({
          type: 'success',
          text: `Событие "${eventName === 'earlyUserPromotion' ? 'Ранний пользователь' : eventName}" ${newValue ? 'включено' : 'отключено'}`
        });
      } catch (error) {
        console.error('Failed to toggle site event:', error);
        setTemporaryMessage({
          type: 'error',
          text: error.message || 'Не удалось изменить настройку'
        });
      }
    } catch (error) {
      setTemporaryMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setEventsLoading(false);
      isLoadingRef.current = false;
    }
  };

  return {
    siteEvents,
    eventsLoading,
    loadSiteEvents,
    toggleSiteEvent
  };
}; 