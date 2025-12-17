# ⚡ Comandos Rápidos - Sistema de Monitoramento

## 🚀 Iniciar Aplicação

```bash
# Instalar dependências (primeira vez)
npm install

# Iniciar servidor de desenvolvimento
npm start

# Build para produção
npm run build
```

---

## 🧪 Testar Sistema

### Backend Health Check
```bash
# Verificar se backend está online
curl http://localhost:3000/health | jq

# Verificar stats
curl http://localhost:3000/monitoring/stats | jq

# Verificar estado completo
curl http://localhost:3000/monitoring/state | jq

# Verificar dispositivos
curl http://localhost:3000/monitoring/devices | jq

# Verificar cache
curl http://localhost:3000/monitoring/cache | jq
```

### WebSocket Test (Node.js)
```javascript
// test-websocket.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: { token: 'SEU_TOKEN_AQUI' }
});

socket.on('connect', () => {
  console.log('✅ Conectado:', socket.id);
});

socket.on('stats:update', (data) => {
  console.log('📊 Stats:', data);
});

socket.on('acesso:novo', (data) => {
  console.log('🚪 Acesso:', data);
});

// Executar: node test-websocket.js
```

---

## 🔧 Desenvolvimento

### Limpar Cache
```bash
# Limpar node_modules
rm -rf node_modules package-lock.json
npm install

# Limpar build
rm -rf build

# Limpar cache do npm
npm cache clean --force
```

### Ver Logs
```bash
# Ver logs do servidor
tail -f server.log

# Ver logs com cores
npm start | bunyan
```

### Debug Mode
```bash
# Rodar com debug do React
REACT_APP_DEBUG=true npm start

# Rodar com source maps
GENERATE_SOURCEMAP=true npm start
```

---

## 📦 Gerenciar Dependências

### Instalar Nova Dependência
```bash
npm install nome-do-pacote
```

### Atualizar Dependências
```bash
# Ver pacotes desatualizados
npm outdated

# Atualizar um pacote
npm update nome-do-pacote

# Atualizar todos
npm update
```

### Remover Dependência
```bash
npm uninstall nome-do-pacote
```

---

## 🐛 Debugging

### Inspecionar Bundle
```bash
# Analisar tamanho do bundle
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

### Verificar Portas em Uso
```bash
# macOS/Linux
lsof -i :3000
lsof -i :3001

# Windows
netstat -ano | findstr :3000
```

### Matar Processo
```bash
# macOS/Linux
kill -9 $(lsof -t -i:3000)

# Windows
taskkill /PID <PID> /F
```

---

## 🧹 Manutenção

### Limpar Console Logs
```bash
# Remover console.logs do código
npx eslint . --fix --rule 'no-console: error'
```

### Formatar Código
```bash
# Se usar Prettier
npx prettier --write "src/**/*.{js,jsx,json,css}"
```

### Verificar Erros
```bash
# Lint
npm run lint

# TypeScript (se usar)
npm run type-check
```

---

## 📊 Performance

### Analisar Performance
```bash
# Build de produção com análise
npm run build -- --stats

# Ver bundle analyzer
npx webpack-bundle-analyzer build/bundle-stats.json
```

### Otimizar Imagens
```bash
# Comprimir imagens
npx imagemin src/img/* --out-dir=src/img/optimized
```

---

## 🔐 Segurança

### Audit de Segurança
```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Forçar correções (cuidado!)
npm audit fix --force
```

---

## 🌐 Deploy

### Build Produção
```bash
# Criar build otimizado
npm run build

# Testar build local
npx serve -s build
```

### Deploy Vercel
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel

# Deploy produção
vercel --prod
```

### Deploy Netlify
```bash
# Instalar CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy produção
netlify deploy --prod
```

---

## 🔄 Git

### Commits Úteis
```bash
# Commit de feature
git commit -m "feat: adiciona monitoramento em tempo real"

# Commit de bug fix
git commit -m "fix: corrige conexão WebSocket"

# Commit de docs
git commit -m "docs: atualiza guia de integração"
```

### Branches
```bash
# Criar branch
git checkout -b feature/websocket-integration

# Merge
git checkout main
git merge feature/websocket-integration

# Delete branch
git branch -d feature/websocket-integration
```

---

## 🧪 Testes Rápidos no Console do Navegador

### Testar WebSocket
```javascript
// Conectar manualmente
const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('token') }
});

// Ver eventos
socket.onAny((event, ...args) => {
  console.log(event, args);
});
```

### Testar React Query
```javascript
// Ver cache
queryClient.getQueryCache().getAll()

// Invalidar query
queryClient.invalidateQueries({ queryKey: ['acessos'] })

// Limpar cache
queryClient.clear()
```

### Testar Zustand
```javascript
// Ver estado
useMonitoringStore.getState()

// Atualizar estado
useMonitoringStore.setState({ stats: { acessos_hoje: 999 } })
```

### Simular Eventos
```javascript
// Simular novo acesso
useMonitoringStore.getState().addRecentAccess({
  pessoa_id: 123,
  dispositivo_id: 1,
  status: 'ENTRADA',
  permitido: true,
  data_hora: new Date().toISOString()
});
```

---

## 📝 Snippets Úteis

### Custom Hook Pattern
```javascript
// useMyHook.js
export const useMyHook = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // ...
  }, []);
  
  return { data };
};
```

### Query Pattern
```javascript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource'],
  queryFn: fetchResource,
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

### Mutation Pattern
```javascript
const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  },
});
```

---

## 🎯 Checklist Pré-Deploy

- [ ] `npm run build` sem erros
- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] `.env.production` configurado
- [ ] Variáveis de ambiente no servidor
- [ ] CORS configurado no backend
- [ ] WebSocket URL de produção
- [ ] Testar em diferentes browsers
- [ ] Testar responsividade
- [ ] Lighthouse score > 90
- [ ] Backup do banco de dados

---

## 🚨 Emergência

### Rollback Rápido
```bash
# Ver último deploy
git log --oneline -10

# Voltar para commit anterior
git reset --hard <commit-hash>
git push --force

# Ou reverter commit
git revert <commit-hash>
git push
```

### Logs de Erro
```bash
# Ver erros do servidor
tail -f /var/log/app/error.log

# Ver último crash
pm2 logs --err --lines 100
```

---

## 📚 Documentação Links

- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://docs.pmnd.rs/zustand/)
- [Socket.io](https://socket.io/docs/v4/)
- [React Router](https://reactrouter.com/)

---

**Comandos salvos em:** `QUICK_COMMANDS.md`
**Última atualização:** 17/12/2025
