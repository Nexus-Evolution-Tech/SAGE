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
import Settings from "./components/pages/Settings/Settings";
import Container from "./components/layout/Container/Container";
import Navbar from "./components/layout/Navbar/Navbar";
import Footer from "./components/layout/Footer/Footer";
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

import AuthInterceptor from './components/AuthInterceptor/AuthInterceptor';

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
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/departamentos" element={<Departamentos />} />
              <Route path="/dispositivos" element={<Dispositivos />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/monitoramento" element={<Monitoramento />} />
              <Route path="/tabelas/:tipo" element={<Tabelas />} />
              <Route path="/tabelas/:tipo/:turmaId" element={<Tabelas />} />
              <Route path="/formulario/:tipo/:id" element={<Formulario />} />
              <Route path="/turmas" element={<Turmas />} />
              <Route path="/adicionar/:tipo" element={<Adicionar />} />
              <Route path="/regras" element={<Regras />} />
              <Route path="/horarios" element={<Horarios />} />
              <Route path="/areas" element={<Areas />} />
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
      <AuthInterceptor />
      <AppContent />
    </Router>
  );
}

export default App;