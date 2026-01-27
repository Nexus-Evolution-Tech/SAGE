import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Pessoas from "./components/pages/Pessoas/Pessoas";
import Departamentos from "./components/pages/Departamentos/Departamentos";
import Dispositivos from "./components/pages/Dispositivos/Dispositivos";
import Container from "./components/layout/Container/Container";
import Navbar from "./components/layout/Navbar/Navbar";
import Footer from "./components/layout/Footer/Footer";
import Home from "./components/pages/Home/Home";
import Monitoring from "./components/pages/Monitoring/Monitoring";
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
import AcessoRelatorio from "./components/pages/Relatorios/Acesso";
import { Navigate } from "react-router-dom";

import AuthInterceptor from './components/AuthInterceptor/AuthInterceptor';
import { ReactQueryProvider } from './contexts/ReactQueryProvider';
import { WebSocketProvider } from './contexts/WebSocketContext';

function AppContent() {
  const location = useLocation();

  const isPublicPage = location.pathname === "/" || 
                       location.pathname === "/login" || 
                       location.pathname === "/cadastro";

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

            <Route element={<ProtectedRoute />}>
              <Route path="/pessoas" element={<Pessoas />} />
              <Route path="/inicio" element={<Home />} />
              <Route path="/departamentos" element={<Departamentos />} />
              <Route path="/dispositivos" element={<Dispositivos />} />
              <Route path="/monitoramento" element={<Monitoring />} />
              <Route path="/tabelas/:tipo" element={<Tabelas />} />
              <Route path="/tabelas/:tipo/:turmaId" element={<Tabelas />} />
              <Route path="/formulario/:tipo/:id" element={<Formulario />} />
              <Route path="/turmas" element={<Turmas />} />
              <Route path="/adicionar/:tipo" element={<Adicionar />} />
              <Route path="/regras" element={<Regras />} />
              <Route path="/horarios" element={<Horarios />} />
              <Route path="/aulas" element={<Aulas />} />
              <Route path="/areas" element={<Areas />} />
              <Route path="/relatorios" element={<Navigate to="/relatorios/acesso" replace />} />
              <Route path="/relatorios/acesso" element={<AcessoRelatorio />} />
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
          <AuthInterceptor />
          <AppContent />
        </WebSocketProvider>
      </ReactQueryProvider>
    </Router>
  );
}

export default App;