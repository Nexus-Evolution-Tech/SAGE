import { create } from 'zustand';

const useMonitoringStore = create(
  (set, get) => ({
      // Stats em tempo real
      stats: null,
      
      // Status dos dispositivos
      deviceStatuses: [],
      
      // Fila de sincronização
      syncQueue: [],
      syncInProgress: [],
      
      // Últimos acessos
      recentAccesses: [],
      
      // Usuários conectados
      connectedUsers: [],
      
      // Estado de conexão
      isConnected: false,
      
      // Timestamp da última atualização
      lastUpdate: null,

      // Actions
      setStats: (stats) => set({ 
        stats, 
        lastUpdate: new Date().toISOString() 
      }),

      setDeviceStatuses: (deviceStatuses) => set({ 
        deviceStatuses,
        lastUpdate: new Date().toISOString()
      }),

      updateDeviceStatus: (deviceId, status) => set((state) => ({
        deviceStatuses: state.deviceStatuses.map((device) =>
          device.dispositivo_id === deviceId
            ? { ...device, ...status }
            : device
        ),
        lastUpdate: new Date().toISOString()
      })),

      setSyncQueue: (syncQueue) => set({ 
        syncQueue,
        lastUpdate: new Date().toISOString()
      }),

      setSyncInProgress: (syncInProgress) => set({ 
        syncInProgress,
        lastUpdate: new Date().toISOString()
      }),

      addRecentAccess: (access) => set((state) => ({
        recentAccesses: [access, ...state.recentAccesses].slice(0, 50), // Manter apenas os últimos 50
        lastUpdate: new Date().toISOString()
      })),

      setRecentAccesses: (recentAccesses) => set({ 
        recentAccesses,
        lastUpdate: new Date().toISOString()
      }),

      setConnectedUsers: (connectedUsers) => set({ 
        connectedUsers,
        lastUpdate: new Date().toISOString()
      }),

      setIsConnected: (isConnected) =>
        set((state) =>
          state.isConnected === isConnected
            ? state
            : { isConnected }
        ),

      // Atualizar estado completo de uma vez
      updateFullState: (data) => set({
        syncInProgress: data.syncInProgress || [],
        syncQueue: data.syncQueue || [],
        deviceStatuses: data.deviceStatuses || [],
        connectedUsers: data.connectedUsers || [],
        stats: data.stats || null,
        lastUpdate: new Date().toISOString()
      }),

      // Limpar dados
      clearData: () => set({
        stats: null,
        deviceStatuses: [],
        syncQueue: [],
        syncInProgress: [],
        recentAccesses: [],
        connectedUsers: [],
        lastUpdate: null
      })
    })
);

export default useMonitoringStore;
