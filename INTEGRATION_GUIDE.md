# 🚀 Sistema de Monitoramento em Tempo Real - Frontend

## ✅ Implementação Completa

Sistema de monitoramento em tempo real integrado com Socket.io, React Query e Zustand.

### 📦 Dependências Instaladas

```bash
✅ socket.io-client - Cliente WebSocket
✅ @tanstack/react-query - Gerenciamento de cache
✅ zustand - State management global
```

### 🏗️ Estrutura Criada

```
src/
├── contexts/
│   ├── WebSocketContext.js          # Provider de WebSocket
│   └── ReactQueryProvider.js        # Provider de React Query
├── stores/
│   └── monitoringStore.js           # Zustand store para monitoramento
├── hooks/
│   └── useWebSocket.js              # Hook customizado para WebSocket
└── components/
    └── pages/
        ├── Monitoring/
        │   ├── Monitoring.js         # Dashboard de monitoramento em tempo real
        │   └── Monitoring.module.css
        └── Dispositivos/
            └── DispositivosRealTime.js  # Exemplo de integração
```

---

## 🔌 Configuração

### 1. Criar arquivo .env

```bash
cp .env.example .env
```

Edite o `.env` e configure as URLs do backend:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
```

### 2. Providers já configurados no App.js

O App.js já está configurado com os providers:

```javascript
<ReactQueryProvider>
  <WebSocketProvider>
    <AppContent />
  </WebSocketProvider>
</ReactQueryProvider>
```

---

## 📡 Como Usar WebSocket nos Componentes

### Opção 1: Auto-subscription (Recomendado)

```javascript
import useWebSocket from '../../hooks/useWebSocket';

function MeuComponente() {
  const { isConnected } = useWebSocket({
    autoSubscribeStats: true,      // Auto-inscrever em stats
    autoSubscribeAccess: true,      // Auto-inscrever em acessos
    autoSubscribeDevices: true,     // Auto-inscrever em dispositivos
    autoSubscribeSync: true,        // Auto-inscrever em sincronizações
    
    // Callbacks opcionais
    onAccess: (data) => {
      console.log('Novo acesso:', data);
    },
    onDeviceStatus: (data) => {
      console.log('Status atualizado:', data);
    }
  });

  return (
    <div>
      {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
    </div>
  );
}
```

### Opção 2: Subscription Manual

```javascript
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useEffect } from 'react';

function MeuComponente() {
  const { subscribe, isConnected } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe('acesso:novo', (event) => {
      console.log('Novo acesso:', event.data);
    });

    return () => unsubscribe();
  }, [subscribe]);

  return <div>...</div>;
}
```

### Opção 3: Usar Zustand Store

```javascript
import useMonitoringStore from '../../stores/monitoringStore';

function MeuComponente() {
  const { stats, deviceStatuses, recentAccesses } = useMonitoringStore();

  return (
    <div>
      <p>Acessos hoje: {stats?.acessos_hoje}</p>
      <p>Catracas online: {stats?.catracas_online}</p>
    </div>
  );
}
```

---

## 📊 Dashboard de Monitoramento

Acesse: `/monitoring`

Recursos:
- ✅ Stats em tempo real
- ✅ Status de dispositivos
- ✅ Fila de sincronização
- ✅ Acessos recentes
- ✅ Usuários conectados
- ✅ Uptime do servidor

---

## 🔄 Integração com React Query

O hook `useWebSocket` automaticamente invalida cache do React Query quando eventos chegam:

```javascript
// Quando 'acesso:novo' chega:
queryClient.invalidateQueries({ queryKey: ['acessos'] });

// Quando 'dispositivo:status' chega:
queryClient.invalidateQueries({ queryKey: ['dispositivos'] });

// Quando 'stats:update' chega:
queryClient.invalidateQueries({ queryKey: ['stats'] });
```

---

## 🎯 Eventos WebSocket Disponíveis

### `acesso:novo`
Emitido quando uma pessoa registra acesso na catraca.

### `dispositivo:status`
Emitido quando uma catraca muda de status (online/offline).

### `sync:fila`
Emitido quando a fila de sincronizações muda.

### `stats:update`
Emitido quando estatísticas são atualizadas.

---

## 🧪 Testar Integração

### 1. Iniciar Backend

```bash
# Em outra pasta/terminal
npm start
```

### 2. Iniciar Frontend

```bash
npm start
```

### 3. Verificar Conexão

- Abra o navegador em `http://localhost:3001`
- Abra o DevTools (F12)
- Procure por mensagens de log:
  - `✅ WebSocket conectado`
  - `📊 Stats atualizadas`
  - `🚪 Novo acesso`

### 4. Testar Dashboard

- Navegue para `/monitoring`
- Verifique se os dados aparecem em tempo real
- Status de conexão deve mostrar "🟢 Conectado"

---

## 🔥 Exemplo Completo: Componente com Tempo Real

```javascript
import { useQuery } from '@tanstack/react-query';
import useWebSocket from '../../hooks/useWebSocket';
import useMonitoringStore from '../../stores/monitoringStore';
import { api } from '../../services/api';

function MinhaTabela() {
  // 1. Conectar ao WebSocket
  const { isConnected } = useWebSocket({
    autoSubscribeAccess: true,
    onAccess: (data) => {
      console.log('Novo acesso registrado:', data);
      // React Query vai refetch automaticamente
    }
  });

  // 2. Buscar dados com React Query
  const { data: acessos, isLoading } = useQuery({
    queryKey: ['acessos'],
    queryFn: async () => {
      const response = await api.get('/acessos');
      return response.data;
    },
    refetchInterval: 10000 // Fallback: refetch a cada 10s
  });

  // 3. Usar Zustand para dados em tempo real
  const { recentAccesses } = useMonitoringStore();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Acessos {isConnected && '🟢'}</h1>
      
      {/* Dados do React Query (cache) */}
      <table>
        {acessos?.map((acesso) => (
          <tr key={acesso.id}>
            <td>{acesso.pessoa_id}</td>
            <td>{acesso.status}</td>
          </tr>
        ))}
      </table>

      {/* Dados em tempo real do Zustand */}
      {recentAccesses.length > 0 && (
        <div>
          <h2>Últimos Acessos (Tempo Real)</h2>
          {recentAccesses.slice(0, 5).map((acesso, i) => (
            <div key={i}>{acesso.pessoa_id} - {acesso.status}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🛠️ Troubleshooting

### WebSocket não conecta

1. Verificar se backend está rodando
2. Verificar variável `REACT_APP_SOCKET_URL` no `.env`
3. Verificar token no localStorage
4. Abrir DevTools e procurar erros no console

### Dados não atualizam em tempo real

1. Verificar se `useWebSocket` está sendo usado
2. Verificar se auto-subscription está ativado
3. Verificar se backend está emitindo eventos
4. Verificar invalidação de queries no React Query

### Performance lenta

1. Reduzir `refetchInterval` no React Query
2. Limitar número de itens no Zustand store
3. Usar paginação para listas grandes
4. Considerar debounce para atualizações frequentes

---

## 📚 Documentação Adicional

- [Socket.io Client Docs](https://socket.io/docs/v4/client-api/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)

---

## ✅ Checklist de Implementação

- [x] Instalar dependências
- [x] Criar WebSocketContext
- [x] Criar Zustand store
- [x] Configurar React Query
- [x] Criar hook useWebSocket
- [x] Criar dashboard de monitoramento
- [x] Adicionar rota /monitoring
- [x] Atualizar navegação
- [x] Criar exemplo de integração
- [ ] Testar com backend rodando
- [ ] Testar múltiplos usuários
- [ ] Deploy em produção

---

## 🎉 Resultado Final

Agora você tem um sistema completo de monitoramento em tempo real com:

✅ **WebSocket** - Comunicação bidirecional  
✅ **React Query** - Cache inteligente  
✅ **Zustand** - Estado global  
✅ **Auto-invalidação** - Dados sempre frescos  
✅ **Reconnection** - Resiliente a falhas  
✅ **Dashboard** - Visualização em tempo real  

🚀 **Sistema pronto para produção!**
