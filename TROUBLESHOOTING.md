# 🔧 Troubleshooting - Sistema de Monitoramento em Tempo Real

## ❌ Problemas Comuns e Soluções

### 1. WebSocket não conecta

#### Sintomas:
- Console mostra: `🔴 Erro de conexão WebSocket`
- Status mostra: `🔴 Desconectado`
- Nenhum dado em tempo real aparece

#### Soluções:

**A) Verificar se o backend está rodando**
```bash
curl http://localhost:3000/health
```
Deve retornar status 200 com JSON

**B) Verificar variáveis de ambiente**
```bash
# .env
REACT_APP_SOCKET_URL=http://localhost:3000
```
⚠️ Certifique-se de que começa com `REACT_APP_`

**C) Verificar token JWT**
```javascript
// No console do navegador (F12)
localStorage.getItem('token')
```
Se retornar `null`, faça login novamente

**D) Verificar firewall/CORS**
O backend precisa aceitar conexões do frontend:
```javascript
// Backend: server.js
cors({
  origin: 'http://localhost:3001',
  credentials: true
})
```

---

### 2. Dados não atualizam em tempo real

#### Sintomas:
- WebSocket conectado (🟢)
- Mas dados não atualizam automaticamente
- Precisa dar refresh manual (F5)

#### Soluções:

**A) Verificar se está usando useWebSocket**
```javascript
// ❌ ERRADO - não vai atualizar
function MeuComponente() {
  const { data } = useQuery(...);
  return <div>{data}</div>;
}

// ✅ CORRETO - atualiza automaticamente
function MeuComponente() {
  useWebSocket({ autoSubscribeAccess: true });
  const { data } = useQuery(...);
  return <div>{data}</div>;
}
```

**B) Verificar eventos WebSocket no backend**
```javascript
// Console do navegador (F12)
// Deve aparecer mensagens como:
// 📊 Stats atualizadas: {...}
// 🚪 Novo acesso: {...}
```

Se não aparecer, o backend não está emitindo eventos

**C) Verificar queryKey correto**
```javascript
// ❌ ERRADO - queryKey diferente
const { data } = useQuery({ queryKey: ['meus-acessos'] });

// ✅ CORRETO - queryKey padrão
const { data } = useQuery({ queryKey: ['acessos'] });
```

---

### 3. Erro: "useWebSocketContext must be used within WebSocketProvider"

#### Solução:

Certifique-se de que App.js tem os providers:

```javascript
// App.js
function App() {
  return (
    <Router>
      <ReactQueryProvider>           {/* ✅ Precisa estar aqui */}
        <WebSocketProvider>           {/* ✅ Precisa estar aqui */}
          <AppContent />
        </WebSocketProvider>
      </ReactQueryProvider>
    </Router>
  );
}
```

---

### 4. Erro: "Cannot read property 'acessos_hoje' of undefined"

#### Sintomas:
```
TypeError: Cannot read property 'acessos_hoje' of undefined
```

#### Solução:

Sempre use optional chaining ou fallback:

```javascript
// ❌ ERRADO
<p>{stats.acessos_hoje}</p>

// ✅ CORRETO
<p>{stats?.acessos_hoje || 0}</p>
```

---

### 5. Performance lenta / muitos refetches

#### Sintomas:
- Aplicação travando
- Muitas requisições na aba Network
- CPU alta

#### Soluções:

**A) Aumentar staleTime no React Query**
```javascript
const { data } = useQuery({
  queryKey: ['acessos'],
  queryFn: fetchAcessos,
  staleTime: 1000 * 60 * 5, // 5 minutos
});
```

**B) Remover refetchInterval desnecessário**
```javascript
// ❌ ERRADO - refetch a cada 1 segundo
refetchInterval: 1000

// ✅ MELHOR - WebSocket cuida disso
// Não usar refetchInterval se WebSocket está ativo
```

**C) Limitar dados no store**
```javascript
// monitoringStore.js
addRecentAccess: (access) => set((state) => ({
  recentAccesses: [access, ...state.recentAccesses].slice(0, 50) // Apenas 50
}))
```

---

### 6. Zustand DevTools não aparecem

#### Solução:

Instale a extensão do navegador:
- Chrome: [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools)
- Firefox: [Redux DevTools](https://addons.mozilla.org/firefox/addon/reduxdevtools/)

E verifique:
```javascript
// monitoringStore.js
export default useMonitoringStore = create(
  devtools(
    (set) => ({ ... }),
    { enabled: true } // ✅ Deve estar true
  )
);
```

---

### 7. React Query DevTools não aparecem

#### Solução:

Verificar se está em modo desenvolvimento:
```bash
# .env
NODE_ENV=development
```

E verificar código:
```javascript
// ReactQueryProvider.js
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

---

### 8. Erro 401 Unauthorized no WebSocket

#### Sintomas:
```
Error: Unauthorized
WebSocket connection failed
```

#### Soluções:

**A) Token expirado**
```javascript
// Fazer login novamente
// Ou implementar refresh token
```

**B) Token não está sendo enviado**
```javascript
// WebSocketContext.js
const socketInstance = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('token') // ✅ Certifique-se disso
  }
});
```

---

### 9. Dados duplicados ou desatualizados

#### Sintomas:
- Mesmo item aparece duas vezes
- Dados antigos misturados com novos

#### Solução:

Invalidar cache corretamente:
```javascript
queryClient.invalidateQueries({ 
  queryKey: ['acessos'],
  exact: true  // ✅ Adicionar exact
});
```

Ou limpar cache completamente:
```javascript
queryClient.clear(); // Remove todo o cache
```

---

### 10. Erro: "Module not found: Can't resolve 'zustand'"

#### Solução:

Reinstalar dependências:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

Se persistir, instalar manualmente:
```bash
npm install zustand socket.io-client @tanstack/react-query
```

---

## 🧪 Testes de Diagnóstico

### Teste 1: Verificar Conexão Backend
```bash
curl -i http://localhost:3000/health
```
Deve retornar `200 OK`

### Teste 2: Verificar WebSocket Connection
Abra DevTools (F12) → Network → WS
Deve mostrar conexão ativa

### Teste 3: Verificar Token
```javascript
// Console do navegador
console.log(localStorage.getItem('token'))
```
Deve retornar string JWT

### Teste 4: Testar Manualmente Emissão de Eventos
```javascript
// Console do navegador
const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => {
  console.log('Conectado!', socket.id);
});

socket.on('stats:update', (data) => {
  console.log('Stats recebidas:', data);
});
```

### Teste 5: Verificar React Query Cache
```javascript
// Console do navegador
import { queryClient } from './contexts/ReactQueryProvider';
console.log(queryClient.getQueryCache().getAll());
```

---

## 📊 Logs Importantes para Debugging

### Logs esperados no console (ordem):

1. `✅ WebSocket conectado: abc123`
2. `📊 Stats atualizadas: {...}`
3. `🚪 Novo acesso: {...}`
4. `📱 Status de dispositivo: {...}`

### Se não aparecer:

**Falta 1:**
- Problema de conexão com backend
- Token inválido
- CORS bloqueando

**Falta 2, 3, 4:**
- Backend não está emitindo eventos
- Auto-subscription não está ativa
- Event names diferentes

---

## 🆘 Último Recurso

### Resetar Tudo:

```bash
# 1. Limpar cache do navegador
# DevTools → Application → Clear Storage → Clear site data

# 2. Limpar localStorage
localStorage.clear();

# 3. Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# 4. Reiniciar servidor
npm start

# 5. Fazer login novamente
```

---

## 📞 Checklist de Debugging

- [ ] Backend está rodando? (`curl http://localhost:3000/health`)
- [ ] Variável `REACT_APP_SOCKET_URL` está correta?
- [ ] Token existe? (`localStorage.getItem('token')`)
- [ ] WebSocket conectou? (procurar `✅ WebSocket conectado` no console)
- [ ] Providers estão no App.js? (ReactQueryProvider, WebSocketProvider)
- [ ] useWebSocket está sendo usado? (com auto-subscription)
- [ ] queryKey está correto? (ex: `['acessos']`)
- [ ] Backend está emitindo eventos? (procurar logs no backend)
- [ ] CORS está configurado corretamente no backend?
- [ ] Navegador suporta WebSocket? (todos os browsers modernos suportam)

---

## 🔍 Ferramentas de Debugging

1. **React DevTools** - Inspecionar componentes
2. **Redux DevTools** - Ver Zustand store
3. **React Query DevTools** - Ver cache e queries
4. **Network Tab** - Ver requisições HTTP e WS
5. **Console** - Ver logs e erros

---

## ✅ Sistema Funcionando Corretamente

Você saberá que está tudo OK quando:

- ✅ Dashboard `/monitoring` carrega sem erros
- ✅ Status mostra `🟢 Conectado`
- ✅ Stats aparecem e atualizam automaticamente
- ✅ Console mostra logs de WebSocket
- ✅ Não há erros no console do navegador
- ✅ React Query DevTools mostra queries ativas
- ✅ Dados atualizam SEM dar F5

---

**Se nada disso resolver, verifique:**
1. Versões do Node.js e npm
2. Porta 3000 está livre?
3. Firewall/antivírus bloqueando?
4. Backend tem mesma versão de Socket.io?

---

**Última atualização:** 17/12/2025
