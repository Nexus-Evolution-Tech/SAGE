import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useWebSocket from '../../../hooks/useWebSocket';
import useMonitoringStore from '../../../stores/monitoringStore';
import Container from '../../layout/Container/Container';
import styles from './Monitoring.module.css';

const Monitoring = () => {
  const {
    stats,
    deviceStatuses,
    syncQueue,
    recentAccesses,
    lastUpdate
  } = useMonitoringStore();

  // Conectar WebSocket com auto-subscription
  useWebSocket({
    autoSubscribeStats: true,
    autoSubscribeAccess: true,
    autoSubscribeDevices: true,
    autoSubscribeSync: true
  });

  // Buscar dados iniciais e manter store sincronizado com o backend
  const { data: initialState } = useQuery({
    queryKey: ['monitoring', 'state'],
    queryFn: async () => {
      const response = await fetch('/monitoring/state');
      if (!response.ok) throw new Error('Falha ao buscar estado do monitoramento');
      return response.json();
    },
    refetchInterval: 10000, // Refetch a cada 10 segundos (lista de acessos sempre atualizada)
  });

  // Aplicar snapshot ao store sempre que a API devolver dados (lista mais recente do banco)
  React.useEffect(() => {
    if (initialState?.data) {
      useMonitoringStore.getState().updateFullState(initialState.data);
    }
  }, [initialState]);

  const currentStats = stats || initialState?.data?.stats;

  // Formatar uptime
  const formatUptime = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Formatar data em horário local (pt-BR)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
      hour12: false
    });
  };

  return (
    <Container>
      <div className={styles.monitoring}>
        <div className={styles.header}>
          <h1>Monitoramento em Tempo Real</h1>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              Última atualização: {formatDate(lastUpdate)}
            </span>
          )}
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚪</div>
            <div className={styles.statContent}>
              <h3>Acessos Hoje</h3>
              <p className={styles.statValue}>{currentStats?.acessos_hoje || 0}</p>
              <span className={styles.statSubtext}>
                {currentStats?.acessos_negados_hoje || 0} negados
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📱</div>
            <div className={styles.statContent}>
              <h3>Catracas</h3>
              <p className={styles.statValue}>
                <span className={styles.online}>{currentStats?.catracas_online || 0}</span>
                {' / '}
                <span className={styles.total}>
                  {(currentStats?.catracas_online || 0) + (currentStats?.catracas_offline || 0)}
                </span>
              </p>
              <span className={styles.statSubtext}>
                {currentStats?.catracas_offline || 0} offline
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔄</div>
            <div className={styles.statContent}>
              <h3>Sincronizações</h3>
              <p className={styles.statValue}>{currentStats?.sincronizacoes_concluidas || 0}</p>
              <span className={styles.statSubtext}>
                {currentStats?.sincronizacoes_falhadas || 0} falhadas
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3>Pessoas Ativas</h3>
              <p className={styles.statValue}>{currentStats?.pessoas_ativas || 0}</p>
              <span className={styles.statSubtext}>cadastradas</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statContent}>
              <h3>Uptime</h3>
              <p className={styles.statValue}>{formatUptime(currentStats?.uptime)}</p>
              <span className={styles.statSubtext}>
                desde {formatDate(currentStats?.uptime_inicio)}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🌐</div>
            <div className={styles.statContent}>
              <h3>Usuários Conectados</h3>
              <p className={styles.statValue}>{currentStats?.usuariosConectados || 0}</p>
              <span className={styles.statSubtext}>websocket</span>
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className={styles.section}>
          <h2>Status dos Dispositivos</h2>
          <div className={styles.deviceGrid}>
            {deviceStatuses && deviceStatuses.length > 0 ? (
              deviceStatuses.map((device) => (
                <div key={device.dispositivo_id} className={styles.deviceCard}>
                  <div className={styles.deviceHeader}>
                    <h3>Dispositivo #{device.dispositivo_id}</h3>
                    <span className={`${styles.badge} ${styles[device.status?.toLowerCase()]}`}>
                      {device.status || 'DESCONHECIDO'}
                    </span>
                  </div>
                  <p className={styles.deviceInfo}>
                    Última verificação: {formatDate(device.lastCheck)}
                  </p>
                </div>
              ))
            ) : (
              <p className={styles.emptyMessage}>Nenhum dispositivo encontrado</p>
            )}
          </div>
        </div>

        {/* Sync Queue */}
        {syncQueue && syncQueue.length > 0 && (
          <div className={styles.section}>
            <h2>Fila de Sincronização ({syncQueue.length})</h2>
            <div className={styles.syncList}>
              {syncQueue.map((sync, index) => (
                <div key={index} className={styles.syncItem}>
                  <span className={styles.syncType}>{sync.type}</span>
                  <span className={styles.syncTarget}>
                    {sync.target || sync.pessoa_id || 'N/A'}
                  </span>
                  <span className={styles.syncTime}>{formatDate(sync.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Accesses */}
        <div className={styles.section}>
          <h2>Acessos Recentes</h2>
          <div className={styles.accessList}>
            {recentAccesses && recentAccesses.length > 0 ? (
              recentAccesses.slice(0, 10).map((access, index) => (
                <div key={access.id ?? `access-${index}`} className={styles.accessItem}>
                  <div className={styles.accessIcon}>
                    {access.permitido ? '✅' : '❌'}
                  </div>
                  <div className={styles.accessContent}>
                    <div className={styles.accessHeader}>
                      <strong>{access.pessoa_nome || `Pessoa #${access.pessoa_id}`}</strong>
                      <span className={`${styles.badge} ${styles[access.status?.toLowerCase()]}`}>
                        {access.status}
                      </span>
                    </div>
                    <div className={styles.accessDetails}>
                      <span>Dispositivo #{access.dispositivo_id}</span>
                      <span>{formatDate(access.data_hora)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyMessage}>Nenhum acesso recente</p>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Monitoring;
