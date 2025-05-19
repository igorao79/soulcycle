import { useState, useRef, useEffect } from 'react';

export const useMessageSystem = () => {
  const [message, setMessage] = useState(null);
  const messageTimeoutRef = useRef(null);

  // Set temporary message with auto-clearing
  const setTemporaryMessage = (messageObj, duration = 3000) => {
    // Clear previous timer if exists
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    // Set new message
    setMessage(messageObj);
    
    // Set timer to clear message
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
    }, duration);
  };

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  return {
    message,
    setTemporaryMessage
  };
}; 