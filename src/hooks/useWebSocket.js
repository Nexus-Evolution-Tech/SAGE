import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import useMonitoringStore from '../stores/monitoringStore';

/**
 * Hook para facilitar uso de WebSocket em componentes
 *
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.autoSubscribeStats - Auto-inscrever em stats:update
 * @param {boolean} options.autoSubscribeAccess - Auto-inscrever em acesso:novo
 * @param {boolean} options.autoSubscribeDevices - Auto-inscrever em dispositivo:status
 * @param {boolean} options.autoSubscribeSync - Auto-inscrever em sync:fila
 * @param {Function} options.onAccess - Callback quando novo acesso acontece
 * @param {Function} options.onDeviceStatus - Callback quando status de dispositivo muda
 * @param {Function} options.onSyncQueue - Callback quando fila de sync muda
 * @param {Function} options.onStats - Callback quando stats atualizam
 */
export const useWebSocket = (options = {}) => {
  const {
    autoSubscribeStats = false,
    autoSubscribeAccess = false,
    autoSubscribeDevices = false,
    autoSubscribeSync = false,
    onAccess,
    onDeviceStatus,
    onSyncQueue,
    onStats
  } = options;

  const { subscribe, emit, isConnected } = useWebSocketContext();
  const joinedAccessRoom = useRef(false);
  const queryClient = useQueryClient();

  const getPayload = useCallback((event) => event?.data ?? event, []);

  const handleNewAccess = useCallback((event) => {
    const payload = getPayload(event);
    console.log('🚪 Novo acesso:', payload);
    if (onAccess) {
      onAccess(payload);
    } else {
      useMonitoringStore.getState().addRecentAccess(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['home', 'acessos'] });
    queryClient.invalidateQueries({ queryKey: ['acessos'] });
  }, [getPayload, onAccess, queryClient]);

  const handleDeviceStatus = useCallback((event) => {
    const payload = getPayload(event);
    console.log('📱 Status de dispositivo:', payload);
    useMonitoringStore.getState().updateDeviceStatus(payload.dispositivo_id, payload);
    if (onDeviceStatus) {
      onDeviceStatus(payload);
    }
  }, [getPayload, onDeviceStatus]);

  const handleSyncQueue = useCallback((event) => {
    const payload = getPayload(event);
    console.log('🔄 Fila de sincronização:', payload);
    useMonitoringStore.getState().setSyncQueue(payload.queue || []);
    if (onSyncQueue) {
      onSyncQueue(payload);
    }
  }, [getPayload, onSyncQueue]);

  const handleStats = useCallback((event) => {
    const payload = getPayload(event);
    console.log('📊 Stats atualizadas:', payload);
    useMonitoringStore.getState().setStats(payload);
    if (onStats) {
      onStats(payload);
    }
  }, [getPayload, onStats]);

  useEffect(() => {
    const unsubscribers = [];

    if (autoSubscribeAccess && isConnected && !joinedAccessRoom.current) {
      console.log('[WS] solicitando entrada na sala acessos');
      emit('join', 'acessos');
      emit('join', { room: 'acessos' });
      joinedAccessRoom.current = true;
    }

    if (autoSubscribeAccess) {
      const unsub = subscribe('acesso:novo', handleNewAccess);
      unsubscribers.push(unsub);
    }

    if (autoSubscribeDevices) {
      const unsub = subscribe('dispositivo:status', handleDeviceStatus);
      unsubscribers.push(unsub);
    }

    if (autoSubscribeSync) {
      const unsub = subscribe('sync:fila', handleSyncQueue);
      unsubscribers.push(unsub);
    }

    if (autoSubscribeStats) {
      const unsub = subscribe('stats:update', handleStats);
      unsubscribers.push(unsub);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      joinedAccessRoom.current = false;
    };
  }, [
    isConnected,
    subscribe,
    emit,
    autoSubscribeAccess,
    autoSubscribeDevices,
    autoSubscribeSync,
    autoSubscribeStats,
    handleNewAccess,
    handleDeviceStatus,
    handleSyncQueue,
    handleStats
  ]);

  useEffect(() => {
    useMonitoringStore.getState().setIsConnected(isConnected);
    if (!isConnected) {
      joinedAccessRoom.current = false;
    }
  }, [isConnected]);

  return {
    isConnected,
    emit,
    subscribe,
    handleNewAccess,
    handleDeviceStatus,
    handleSyncQueue,
    handleStats
  };
};

export default useWebSocket;
