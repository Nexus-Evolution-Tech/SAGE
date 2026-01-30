import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocketContext } from './WebSocketContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const STORAGE_KEY = 'sage_notifications';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('Erro ao carregar notificações do storage:', e);
  }
  return [];
};

const saveToStorage = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.warn('Erro ao salvar notificações:', e);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(loadFromStorage);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  useEffect(() => {
    const unsubscribe = subscribe('notification', (payload) => {
      const notification = {
        id: payload.id || `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: payload.title || 'Nova notificação',
        message: payload.message || '',
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
        type: payload.type || 'info',
      };
      setNotifications((prev) => [notification, ...prev]);
      setHasNewPulse(true);
      setTimeout(() => setHasNewPulse(false), 1500);
    });
    return unsubscribe;
  }, [subscribe]);

  const addNotification = useCallback(({ title = 'Notificação', message = '', type = 'info' }) => {
    const notification = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      type,
    };
    setNotifications((prev) => [notification, ...prev]);
    setHasNewPulse(true);
    setTimeout(() => setHasNewPulse(false), 1500);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    hasNewPulse,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
