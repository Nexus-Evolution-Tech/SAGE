// ============================================
// 🚀 EXEMPLO RÁPIDO: Como usar WebSocket + React Query
// ============================================

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useWebSocket from '../../hooks/useWebSocket';
import useMonitoringStore from '../../stores/monitoringStore';
import { api } from '../../services/api';

function ExemploComponente() {
  const queryClient = useQueryClient();
  
  // ============================================
  // 1️⃣ CONECTAR AO WEBSOCKET
  // ============================================
  const { isConnected } = useWebSocket({
    // Auto-inscrever em eventos que você precisa
    autoSubscribeStats: true,
    autoSubscribeAccess: true,
    autoSubscribeDevices: false,
    autoSubscribeSync: false,
    
    // Callbacks opcionais para reagir a eventos
    onAccess: (data) => {
      console.log('🚪 Novo acesso!', data);
      // Fazer algo quando acesso acontece
      // Ex: mostrar notificação, tocar som, etc
    },
    
    onStats: (data) => {
      console.log('📊 Stats atualizadas!', data);
    }
  });

  // ============================================
  // 2️⃣ BUSCAR DADOS COM REACT QUERY
  // ============================================
  const { data: acessos, isLoading, error } = useQuery({
    queryKey: ['acessos'],
    queryFn: async () => {
      const response = await api.get('/acessos');
      return response.data;
    },
    // Refetch a cada 10 segundos como fallback
    refetchInterval: 10000,
    // Enabled by default, mas você pode desabilitar se quiser
    enabled: true
  });

  // ============================================
  // 3️⃣ USAR ZUSTAND PARA DADOS EM TEMPO REAL
  // ============================================
  const { stats, recentAccesses } = useMonitoringStore();

  // ============================================
  // 4️⃣ MUTATIONS PARA CRIAR/ATUALIZAR/DELETAR
  // ============================================
  const addAcessoMutation = useMutation({
    mutationFn: async (novoAcesso) => {
      const response = await api.post('/acessos', novoAcesso);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar cache para refetch automático
      queryClient.invalidateQueries({ queryKey: ['acessos'] });
      alert('Acesso adicionado com sucesso!');
    },
    onError: (error) => {
      alert('Erro ao adicionar acesso: ' + error.message);
    }
  });

  const handleAddAcesso = () => {
    addAcessoMutation.mutate({
      pessoa_id: 1,
      dispositivo_id: 1,
      status: 'ENTRADA'
    });
  };

  // ============================================
  // 5️⃣ RENDER
  // ============================================
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error.message}</div>;
  }

  return (
    <div>
      {/* Indicador de conexão WebSocket */}
      <header>
        <h1>Meu Componente</h1>
        {isConnected ? (
          <span style={{ color: 'green' }}>🟢 Conectado</span>
        ) : (
          <span style={{ color: 'red' }}>🔴 Desconectado</span>
        )}
      </header>

      {/* Stats em tempo real do Zustand */}
      <section>
        <h2>Estatísticas</h2>
        <p>Acessos hoje: {stats?.acessos_hoje || 0}</p>
        <p>Catracas online: {stats?.catracas_online || 0}</p>
        <p>Pessoas ativas: {stats?.pessoas_ativas || 0}</p>
      </section>

      {/* Dados do React Query (com cache) */}
      <section>
        <h2>Lista de Acessos</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pessoa</th>
              <th>Dispositivo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {acessos?.map((acesso) => (
              <tr key={acesso.id}>
                <td>{acesso.id}</td>
                <td>{acesso.pessoa_id}</td>
                <td>{acesso.dispositivo_id}</td>
                <td>{acesso.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Acessos recentes do WebSocket */}
      <section>
        <h2>Últimos 5 Acessos (Tempo Real)</h2>
        {recentAccesses.slice(0, 5).map((acesso, i) => (
          <div key={i}>
            {acesso.permitido ? '✅' : '❌'} 
            Pessoa {acesso.pessoa_id} - {acesso.status}
          </div>
        ))}
      </section>

      {/* Botão com mutation */}
      <button 
        onClick={handleAddAcesso}
        disabled={addAcessoMutation.isLoading}
      >
        {addAcessoMutation.isLoading ? 'Adicionando...' : 'Adicionar Acesso'}
      </button>
    </div>
  );
}

export default ExemploComponente;

// ============================================
// 📝 RESUMO:
// ============================================
// 
// 1. useWebSocket() - Conecta ao WebSocket e auto-inscreve em eventos
//    ✅ Invalida cache automaticamente quando eventos chegam
//    ✅ Atualiza Zustand store automaticamente
// 
// 2. useQuery() - Busca dados com cache inteligente
//    ✅ Cache automático
//    ✅ Refetch em background
//    ✅ Loading/error states
// 
// 3. useMonitoringStore() - Acessa dados em tempo real
//    ✅ Stats atualizadas via WebSocket
//    ✅ Acessos recentes em tempo real
//    ✅ Status de dispositivos ao vivo
// 
// 4. useMutation() - Cria/atualiza/deleta dados
//    ✅ Loading states automáticos
//    ✅ Invalidação de cache após sucesso
//    ✅ Error handling
// 
// ============================================
// 🎯 FLUXO DE DADOS:
// ============================================
// 
// Usuário abre a página
//   ↓
// useWebSocket conecta automaticamente
//   ↓
// useQuery busca dados iniciais
//   ↓
// Dados ficam em cache
//   ↓
// Backend emite evento WebSocket
//   ↓
// useWebSocket invalida cache
//   ↓
// React Query faz refetch automático
//   ↓
// Componente re-renderiza com dados novos
//   ↓
// Usuário vê dados atualizados SEM RELOAD! 🎉
// 
// ============================================
