# 🔄 Guia Rápido de Migração - Sistema de Cache

## ✅ Checklist de Implementação

### 1️⃣ Já Implementado
- [x] CacheContext criado
- [x] Hooks customizados (useCachedApi, useCachedCreate, useCachedUpdate, useCachedDelete)
- [x] api.js expandido com funções específicas
- [x] App.js envolto com CacheProvider
- [x] Rate limiting do backend ajustado
- [x] Exemplo completo (DepartamentosExample.js)

### 2️⃣ Para Fazer Agora
- [ ] Migrar componente **Departamentos**
- [ ] Migrar componente **Home/Monitoramento**
- [ ] Migrar componente **Adicionar**
- [ ] Migrar componente **Tabelas**
- [ ] Migrar componente **Formulário**
- [ ] Adicionar limpeza de cache no logout

---

## 🚀 Template de Migração

### Para Componentes de Listagem (GET)

```javascript
// ========== ANTES ==========
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

function MeuComponente() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/endpoint');
        setDados(response.data || response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    buscarDados();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;

  return <Lista dados={dados} />;
}

// ========== DEPOIS ==========
import { useCachedApi } from '../../../hooks/useCachedApi';

function MeuComponente() {
  const { data: dados, loading, error, refetch } = useCachedApi(
    'TIPO_RECURSO',  // Ex: 'pessoas', 'turmas', 'acessos'
    '/endpoint'      // Ex: '/pessoas', '/turmas'
  );

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;

  // Extrai array (compatibilidade com formato da API)
  const lista = Array.isArray(dados?.data) ? dados.data : 
                (Array.isArray(dados) ? dados : []);

  return <Lista dados={lista} />;
}
```

---

### Para Componentes com CREATE (POST)

```javascript
// ========== ANTES ==========
import { api } from '../../../services/api';

function FormularioCriar() {
  const handleSubmit = async (dados) => {
    try {
      await api.post('/endpoint', dados);
      alert('Criado com sucesso!');
      // Recarrega página ou faz fetch manual
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };
}

// ========== DEPOIS ==========
import { useCachedCreate } from '../../../hooks/useCachedApi';

function FormularioCriar() {
  const { create } = useCachedCreate('TIPO_RECURSO');

  const handleSubmit = async (dados) => {
    try {
      await create('/endpoint', dados, {
        listCacheKey: 'TIPO_RECURSO:/endpoint'  // Opcional, para atualização otimista
      });
      alert('Criado com sucesso!');
      // ✅ Cache atualizado automaticamente!
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };
}
```

---

### Para Componentes com UPDATE (PUT)

```javascript
// ========== ANTES ==========
import { api } from '../../../services/api';

function FormularioEditar({ id }) {
  const handleSubmit = async (dados) => {
    try {
      await api.patch(`/endpoint/${id}`, dados);
      alert('Atualizado com sucesso!');
      // Recarrega página ou faz fetch manual
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };
}

// ========== DEPOIS ==========
import { useCachedUpdate } from '../../../hooks/useCachedApi';

function FormularioEditar({ id }) {
  const { update } = useCachedUpdate('TIPO_RECURSO');

  const handleSubmit = async (dados) => {
    try {
      await update('/endpoint', id, dados, {
        listCacheKey: 'TIPO_RECURSO:/endpoint'  // Atualiza item na lista
      });
      alert('Atualizado com sucesso!');
      // ✅ Cache atualizado localmente (sem nova requisição)!
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };
}
```

---

### Para Componentes com DELETE

```javascript
// ========== ANTES ==========
import { api } from '../../../services/api';

function BotaoDeletar({ id }) {
  const handleDelete = async () => {
    try {
      await fetch(`http://localhost:3000/endpoint/${id}`, { method: 'DELETE' });
      alert('Deletado com sucesso!');
      // Recarrega página
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };
}

// ========== DEPOIS ==========
import { useCachedDelete } from '../../../hooks/useCachedApi';

function BotaoDeletar({ id }) {
  const { remove } = useCachedDelete('TIPO_RECURSO');

  const handleDelete = async () => {
    try {
      await remove('/endpoint', id, {
        listCacheKey: 'TIPO_RECURSO:/endpoint'  // Remove da lista localmente
      });
      alert('Deletado com sucesso!');
      // ✅ Cache atualizado localmente (sem nova requisição)!
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };
}
```

---

## 📋 Mapeamento de Recursos

Use estes valores para o parâmetro `TIPO_RECURSO`:

| Componente/Página | TIPO_RECURSO | Endpoint Comum |
|-------------------|--------------|----------------|
| Departamentos (Alunos) | `'pessoas'` | `/pessoas/tipo/ALUNO` |
| Departamentos (Professores) | `'pessoas'` | `/pessoas/tipo/PROFESSOR` |
| Departamentos (Admin) | `'pessoas'` | `/pessoas/tipo/ADMINISTRADOR` |
| Turmas | `'turmas'` | `/turmas` |
| Cursos | `'cursos'` | `/cursos` |
| Áreas | `'areas'` | `/areas` |
| Dispositivos | `'dispositivos'` | `/dispositivos` |
| Acessos (Tempo Real) | `'acessos'` | `/acessos/hoje` |
| Acessos (Recentes) | `'acessos'` | `/acessos/recentes` |
| Horários | `'horarios'` | `/horarios` |
| Disciplinas | `'disciplinas'` | `/disciplinas` |
| Aulas | `'aulas'` | `/aulas` |
| Empresas | `'empresas'` | `/empresas` |

---

## 🔧 Ajustes Específicos por Componente

### **Departamentos.js**
```javascript
// 4 requisições com cache
const { data: alunos } = useCachedApi('pessoas', '/pessoas/tipo/ALUNO');
const { data: professores } = useCachedApi('pessoas', '/pessoas/tipo/PROFESSOR');
const { data: admin } = useCachedApi('pessoas', '/pessoas/tipo/ADMINISTRADOR');
const { data: terceirizados } = useCachedApi('pessoas', '/pessoas/tipo/TERCEIRIZADO');
```

### **Home/Monitoramento.js**
```javascript
// Dados em tempo real - cache curto (2 minutos)
const { data: acessosHoje, refetch } = useCachedApi('acessos', '/acessos/hoje');

// Auto-refresh a cada 30 segundos
useEffect(() => {
  const interval = setInterval(() => refetch(), 30000);
  return () => clearInterval(interval);
}, [refetch]);
```

### **Adicionar.js** (Formulário)
```javascript
// Busca dados para dropdowns (turmas, cursos, etc.)
const { data: turmas } = useCachedApi('turmas', '/turmas');
const { data: cursos } = useCachedApi('cursos', '/cursos');
const { data: empresas } = useCachedApi('empresas', '/empresas');

// Cria novo registro
const { create } = useCachedCreate('pessoas');

const handleSubmit = async (dados) => {
  await create('/pessoas', dados, {
    listCacheKey: `pessoas:/pessoas/tipo/${dados.tipo}`
  });
};
```

### **Tabelas.js** (Listagem com filtros)
```javascript
import { useMemo } from 'react';

function Tabelas() {
  const { data: pessoas } = useCachedApi('pessoas', '/pessoas');
  
  // Filtra localmente (não faz nova requisição)
  const pessoasFiltradas = useMemo(() => {
    return pessoas?.filter(p => p.tipo === 'ALUNO') || [];
  }, [pessoas]);

  return <Tabela dados={pessoasFiltradas} />;
}
```

---

## 🎨 Componente de Loading Global

Crie um componente reutilizável:

```javascript
// src/components/common/LoadingSpinner.js
import styles from './LoadingSpinner.module.css';

function LoadingSpinner({ message = 'Carregando...' }) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
```

```css
/* src/components/common/LoadingSpinner.module.css */
.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 🚪 Limpeza de Cache no Logout

Adicione ao componente de logout ou AuthInterceptor:

```javascript
// src/components/AuthInterceptor/AuthInterceptor.js
import { useCache } from '../../contexts/CacheContext';

function AuthInterceptor() {
  const { clearAllCache } = useCache();

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAllCache(); // ✅ Limpa cache ao expirar sessão
      localStorage.removeItem('token');
      window.location.href = '/login';
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [clearAllCache]);
}
```

---

## 🧪 Testando a Implementação

### 1. **Teste de Cache**
- Abra Departamentos → aguarde carregar
- Navegue para Monitoramento
- Volte para Departamentos
- ✅ Deve carregar **instantaneamente** (sem nova requisição)

### 2. **Teste de Invalidação**
- Crie um novo aluno
- ✅ Lista deve atualizar automaticamente
- Sem recarregar página

### 3. **Teste de Rate Limit**
- Navegue rapidamente entre 5-10 telas
- ✅ Não deve aparecer erro de rate limit
- Máximo de 4-7 requisições (ao invés de 30-50)

### 4. **Teste de Console**
```javascript
// Abra console do navegador após navegar
console.log('Requisições feitas:', performance.getEntriesByType('resource').length);
```

---

## 📊 Métricas de Sucesso

Após implementar o cache, você deve observar:

| Antes | Depois | ✅ Meta |
|-------|--------|---------|
| 8-15 req/navegação | 1-3 req/navegação | 80% redução |
| 2-4s carregamento | 0.1-0.5s | 5x mais rápido |
| Errors 429 frequentes | Zero erros | 100% eliminado |
| UX lenta e travada | UX fluida | Profissional |

---

## 💡 Dicas Finais

1. **Comece devagar:** Migre um componente por vez
2. **Teste sempre:** Navegue bastante para garantir que funciona
3. **Ajuste TTL:** Se dados mudam muito, reduza o tempo de cache
4. **Use refetch:** Para botões de "atualizar" manualmente
5. **Console é seu amigo:** Use para debugar e ver requisições

---

## 🎯 Ordem de Migração Recomendada

1. ✅ **Departamentos** (exemplo já pronto)
2. ⏳ **Tabelas** (listagens usam bastante)
3. ⏳ **Adicionar** (formulários criam registros)
4. ⏳ **Home/Monitoramento** (tempo real com refetch)
5. ⏳ **Formulário** (edição de registros)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Confirme que CacheProvider está no App.js
3. Verifique se o endpoint está correto
4. Use `refetch()` para forçar nova requisição
5. Limpe o cache com `clearAllCache()` se necessário

---

**Boa sorte com a migração! O sistema ficará muito mais rápido e profissional! 🚀**
