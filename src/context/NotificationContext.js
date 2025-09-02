import React, { createContext, useContext, useState } from 'react';

// Create a context for notifications
const NotificationContext = createContext();

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a notification
  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now(); // unique ID based on timestamp
    
    // Add new notification to the array
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Remove notification after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
    
    return id;
  };

  // Remove a notification by ID
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Shorthand methods for different notification types
  const success = (message, duration) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
  const error = (message, duration) => addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
  const info = (message, duration) => addNotification(message, NOTIFICATION_TYPES.INFO, duration);
  const warning = (message, duration) => addNotification(message, NOTIFICATION_TYPES.WARNING, duration);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification,
      success,
      error,
      info,
      warning
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
