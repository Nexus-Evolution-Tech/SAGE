# Sistema de Controle de Acesso por Catraca - ETEC de Taboão da Serra

## 🚀 NOVO: Sistema de Monitoramento em Tempo Real

**✅ Implementado com sucesso!**

Este projeto agora conta com um **sistema completo de monitoramento em tempo real** usando:
- 🔌 **WebSocket (Socket.io)** - Comunicação bidirecional em tempo real
- 💾 **React Query** - Cache inteligente e gerenciamento de estado do servidor
- 🗂️ **Zustand** - State management global
- 📊 **Dashboard em Tempo Real** - Visualização de stats, dispositivos e acessos ao vivo

**📚 Documentação completa:**
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Guia de integração e uso
- [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) - Resumo das mudanças
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solução de problemas
- [QUICK_COMMANDS.md](./QUICK_COMMANDS.md) - Comandos úteis

---

## Descrição do Projeto
Este projeto tem como objetivo desenvolver um **sistema de controle de acesso por catraca** para a **ETEC de Taboão da Serra**, garantindo um ambiente mais seguro e organizado. A solução será projetada para atender às necessidades da escola, permitindo o gerenciamento eficiente da entrada e saída de alunos, professores e funcionários.

O projeto visa estimular a **inovação** e o **aprendizado prático** dos alunos, promovendo a **colaboração em equipe** e a **aplicação de conhecimentos técnicos** na criação de um sistema funcional e seguro.

---

## Objetivos Específicos
- Desenvolver habilidades técnicas em **programação e desenvolvimento de sistemas**;
- Proporcionar **aprendizado prático** por meio de um projeto real;
- Estimular o **trabalho em equipe** e a **resolução de problemas**;
- Criar um sistema **seguro e eficiente** para o controle de acesso;
- Integrar **tecnologia e segurança** para melhorar a gestão escolar.

---

## Funcionalidades do Sistema
1. **Autenticação Segura** - Controle de acesso por meio de **RFID (cartão estudantil)** ou **QR Code**;
2. **Registro de Entradas e Saídas** - Registro automático dos horários de entrada e saída de cada usuário;
3. **Diferentes Perfis de Acesso** - Permissões distintas para **alunos, professores e funcionários**;
4. **Interface Intuitiva** - Painel administrativo para gestão dos acessos e relatórios;
5. **Banco de Dados Seguro** - Armazenamento das informações de acesso de forma criptografada;
6. **Notificações em Tempo Real** - Avisos automáticos para a administração da escola em caso de acesso não autorizado;
7. **🆕 Monitoramento em Tempo Real** - Dashboard com stats, status de dispositivos e acessos ao vivo;
8. **🆕 Cache Inteligente** - Sistema de cache com Redis/LRU para performance otimizada;
9. **🆕 WebSocket** - Atualização de dados sem necessidade de refresh da página.

---

## Tecnologias Utilizadas

### Frontend
- **React.js** - Framework principal
- **React Router** - Navegação
- **Socket.io Client** - WebSocket em tempo real
- **React Query (@tanstack/react-query)** - Gerenciamento de cache e estado do servidor
- **Zustand** - State management global
- **Font Awesome** - Ícones

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **Socket.io** - WebSocket server
- **Redis/LRU** - Sistema de cache com fallback
- **JWT** - Autenticação

### Banco de Dados
- **MySQL** - Banco de dados relacional

### Hardware
- **RFID e QR Code** - Leitura de identificação
- **Catracas** - Controle físico de acesso

### Infraestrutura
- **Hospedagem:** Banco de dados local

---

## 🚀 Como Executar

### Pré-requisitos
```bash
Node.js >= 16.x
npm >= 8.x
MySQL >= 8.x
```

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/sage.git
cd sage
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite `.env` com suas configurações:
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
NODE_ENV=development
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm start
```

5. **Acesse a aplicação:**
```
http://localhost:3001
```

### Dashboard de Monitoramento

Acesse o novo dashboard em tempo real:
```
http://localhost:3001/monitoring
```

**Recursos do Dashboard:**
- 📊 Estatísticas em tempo real
- 📱 Status de dispositivos (online/offline)
- 🔄 Fila de sincronização
- 🚪 Últimos acessos registrados
- 👥 Usuários conectados
- ⏱️ Uptime do sistema

---

## 📚 Documentação Adicional

### Guias de Integração
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Como usar WebSocket e React Query
- **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)** - Todas as mudanças implementadas
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas comuns
- **[QUICK_COMMANDS.md](./QUICK_COMMANDS.md)** - Comandos úteis para desenvolvimento

### Exemplos de Código
- **[ExemploComponente.js](./src/components/examples/ExemploComponente.js)** - Exemplo completo de uso

---

## 🏗️ Estrutura do Projeto

```
SAGE/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   ├── Monitoring/          # 🆕 Dashboard em tempo real
│   │   │   ├── Dispositivos/
│   │   │   ├── Pessoas/
│   │   │   └── ...
│   │   ├── layout/
│   │   └── examples/                # 🆕 Exemplos de código
│   ├── contexts/
│   │   ├── WebSocketContext.js      # 🆕 WebSocket provider
│   │   └── ReactQueryProvider.js    # 🆕 React Query config
│   ├── stores/
│   │   └── monitoringStore.js       # 🆕 Zustand store
│   ├── hooks/
│   │   ├── useWebSocket.js          # 🆕 Hook customizado
│   │   └── useCachedApi.js
│   ├── services/
│   │   └── api.js
│   └── App.js
├── public/
├── docs/                             # 🆕 Documentação
│   ├── INTEGRATION_GUIDE.md
│   ├── CHANGES_SUMMARY.md
│   ├── TROUBLESHOOTING.md
│   └── QUICK_COMMANDS.md
└── package.json
```

---
## Equipe
- Integrantes:
  - **Caio Amaral de Pieri**
  - **Cauã Alonso Martos**
  - **Douglas Gomes de Campos**
  - **Leonardo Gonçalves Jorge**
  - **Igor Fernando Casita Ferreira da Silva**


