import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export const SOCKET_SUBSCRIPTION_EVENTS = Object.freeze({
  access: 'subscribe:acessos',
  devices: 'subscribe:dispositivos',
  sync: 'subscribe:sync',
  stats: 'subscribe:stats'
});

const ALLOWED_SOCKET_EMITS = new Set(Object.values(SOCKET_SUBSCRIPTION_EVENTS));
const DEFAULT_SOCKET_PATH = '/socket.io';
const DISCONNECTED_ERROR = 'WebSocket desconectado';

const WebSocketContext = createContext(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const [sessionToken, setSessionToken] = useState(() => {
    const token = localStorage.getItem('token');
    return token && token.trim() ? token : null;
  });

  useEffect(() => {
    const updateSessionToken = () => {
      const token = localStorage.getItem('token');
      setSessionToken(token && token.trim() ? token : null);
    };

    const handleStorageChange = (event) => {
      if (!event.key || event.key === 'token') {
        updateSessionToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', updateSessionToken);
    window.addEventListener('auth-expired', updateSessionToken);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', updateSessionToken);
      window.removeEventListener('auth-expired', updateSessionToken);
    };
  }, []);

  useEffect(() => {
    // Obter token do localStorage
    
    // Sem URL explícita, Socket.IO usa a mesma origem da página no pacote de produção.
    const socketPath = process.env.REACT_APP_SOCKET_PATH || DEFAULT_SOCKET_PATH;

    if (!sessionToken) {
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      return undefined;
    }

    setIsConnected(false);
    setConnectionError(DISCONNECTED_ERROR);

    // Criar conexão Socket.io
    const socketInstance = io({ path: socketPath }, {
      auth: {
        token: sessionToken
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling']
    });

    // Event listeners
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setConnectionError((currentError) => currentError || DISCONNECTED_ERROR);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Erro de conexão WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔴 Erro ao reconectar:', error);
      setConnectionError(error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('🔴 Falha ao reconectar após múltiplas tentativas');
      setConnectionError('Não foi possível reconectar ao servidor');
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
      setSocket((currentSocket) => currentSocket === socketInstance ? null : currentSocket);
      setIsConnected(false);
    };
  }, [sessionToken]);

  // Função para emitir eventos
  const emit = useCallback((event, data) => {
    if (!ALLOWED_SOCKET_EMITS.has(event)) {
      console.warn('Evento WebSocket nÃ£o permitido:', event);
      return;
    }
    if (socket && isConnected) {
      if (data === undefined) {
        socket.emit(event);
      } else {
        socket.emit(event, data);
      }
    } else {
      console.warn('⚠️ Socket não conectado, não foi possível emitir:', event);
    }
  }, [socket, isConnected]);

  // Função para inscrever em eventos
  const subscribe = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  const value = {
    socket,
    isConnected,
    connectionError,
    emit,
    subscribe
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
