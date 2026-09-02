import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import ProtectedRoute, { AdminOnlyRoute } from "./components/ProtectedRoute/ProtectedRoute";

import Pessoas from "./components/pages/Pessoas/Pessoas";
import Departamentos from "./components/pages/Departamentos/Departamentos";
import Dispositivos from "./components/pages/Dispositivos/Dispositivos";
import Container from "./components/layout/Container/Container";
import Navbar from "./components/layout/Navbar/Navbar";
import Monitoramento from "./components/pages/Home/Home";
import Login from "./components/pages/Login/Login";
import Cadastro from "./components/pages/Cadastro/Cadastro";
import Tabelas from "././components/pages/Tabelas/Tabelas";
import Formulario from "./components/pages/Formulario/Formulario";
import Turmas from "./components/pages/Turmas/Turmas";
import Adicionar from "./components/pages/Adicionar/Adicionar";
import Inicio from "./components/pages/Inicio/Inicio";
import ToolBar from "./components/layout/ToolBar/ToolBar";
import Regras from "./components/pages/Regras/Regras";
import Horarios from "./components/pages/Horarios/Horarios";
import Areas from "./components/pages/Areas/Areas";
import Aulas from "./components/pages/Aulas/Aulas";
import RelatoriosAcesso from "./components/pages/Relatorios/RelatoriosAcesso";
import PessoaHistorico from "./components/pages/Relatorios/PessoaHistorico";
import Jornada from "./components/pages/Relatorios/Jornada";
import Settings from "./components/pages/Settings/Settings";
import TrocarSenha from "./components/pages/TrocarSenha/TrocarSenha";
import EsqueciSenha from "./components/pages/EsqueciSenha/EsqueciSenha";
import Dados from "./components/pages/Dados/DadosEscolares";
import Monitoring from "./components/pages/Monitoring/Monitoring";
import Onboarding from "./components/pages/Onboarding/Onboarding";

import AuthInterceptor from './components/AuthInterceptor/AuthInterceptor';
import { ReactQueryProvider } from './contexts/ReactQueryProvider';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

function AppContent() {
  const location = useLocation();

  const isPublicPage = location.pathname === "/" ||
                       location.pathname === "/login" ||
                       location.pathname === "/cadastro" ||
                       location.pathname === "/esqueci-senha";

  return (
    <div className="App">
      {!isPublicPage && (
        <>
          <Navbar />
          <ToolBar />
        </>
      )}

      <div className="content">
        <Container customClass="min-height">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/pessoas" element={<Pessoas />} />
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/departamentos" element={<Departamentos />} />
              <Route element={<AdminOnlyRoute />}>
                <Route path="/dispositivos" element={<Dispositivos />} />
                <Route path="/monitoramento" element={<Monitoramento />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>
              <Route path="/tabelas/:tipo" element={<Tabelas />} />
              <Route path="/tabelas/:tipo/:turmaId" element={<Tabelas />} />
              <Route path="/formulario/:tipo/:id" element={<Formulario />} />
              <Route path="/turmas" element={<Turmas />} />
              <Route path="/adicionar/:tipo" element={<Adicionar />} />
              <Route path="/regras" element={<Regras />} />
              <Route path="/horarios" element={<Horarios />} />
              <Route path="/relatorios" element={<RelatoriosAcesso />} />
              <Route path="/relatorios/jornada" element={<Jornada />} />
              <Route path="/relatorios/pessoa/:id" element={<PessoaHistorico />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/trocar-senha" element={<TrocarSenha />} />
              <Route path="/aulas" element={<Aulas />} />
              <Route path="/areas" element={<Areas />} />
              <Route path="/dados" element={<Dados />} />
            </Route>
            

          </Routes>
        </Container>
      </div>

    </div>
  );
}

function App() {
  return (
    <Router>
      <ReactQueryProvider>
        <WebSocketProvider>
          <NotificationProvider>
            <AuthInterceptor />
            <AppContent />
          </NotificationProvider>
        </WebSocketProvider>
      </ReactQueryProvider>
    </Router>
  );
}

export default App;
