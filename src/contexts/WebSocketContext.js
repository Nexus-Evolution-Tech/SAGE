import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

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

  useEffect(() => {
    // Obter token do localStorage
    const token = localStorage.getItem('token');
    
    // URL do backend - ajustar conforme necessário
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

    // Criar conexão Socket.io
    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: token || ''
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Event listeners
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket conectado:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);

      if (process.env.NODE_ENV === 'development') {
        socketInstance.onAny((event, ...args) => {
          console.log('[WS onAny]', event, args);
        });
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Erro de conexão WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconectado após ${attemptNumber} tentativas`);
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
      console.log('🧹 Limpando conexão WebSocket');
      socketInstance.disconnect();
    };
  }, []);

  // Função para emitir eventos
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
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
