import { useState, useEffect } from "react";
import styles from "./Relatorios.module.css";
import { api } from "../../../services/api";

function Relatorios() {
  // Estado para filtros
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    tipo: "",
    dispositivoId: "",
    status: "",
    areaId: "",
  });

  // Estado para dados
  const [acessos, setAcessos] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 20;

  // Estado para loading e erros
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Carregar dispositivos e áreas ao montar o componente
  useEffect(() => {
    loadDispositivos();
    loadAreas();
    loadAcessos(); // Carregar acessos iniciais
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para carregar dispositivos
  const loadDispositivos = async () => {
    try {
      const data = await api.get("/dispositivos");
      setDispositivos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar dispositivos:", err);
    }
  };

  // Função para carregar áreas
  const loadAreas = async () => {
    try {
      const data = await api.get("/areas");
      setAreas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar áreas:", err);
    }
  };

  // Função para carregar acessos
  const loadAcessos = async (page = 1, filterParams = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir query string com filtros
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", recordsPerPage);
      
      if (filterParams.dataInicio) {
        params.append("data_inicio", filterParams.dataInicio);
      }
      if (filterParams.dataFim) {
        params.append("data_fim", filterParams.dataFim);
      }
      if (filterParams.tipo) {
        params.append("tipo", filterParams.tipo);
      }
      if (filterParams.dispositivoId) {
        params.append("dispositivo_id", filterParams.dispositivoId);
      }
      if (filterParams.status) {
        // Convert string "true"/"false" to actual param the API expects
        params.append("permitido", filterParams.status);
      }
      if (filterParams.areaId) {
        params.append("area_id", filterParams.areaId);
      }

      const queryString = params.toString();
      const response = await api.get(`/acessos?${queryString}`);
      
      // Verificar se a resposta tem a estrutura esperada
      if (response && typeof response === 'object' && Array.isArray(response.data)) {
        setAcessos(response.data);
        setTotalRecords(response.total || response.data.length);
      } else if (Array.isArray(response)) {
        setAcessos(response);
        setTotalRecords(response.length);
      } else {
        setAcessos([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Erro ao carregar acessos:", err);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
      setAcessos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Validar filtros
  const validateFilters = () => {
    setValidationError(null);

    // Validar datas
    if (filters.dataInicio && filters.dataFim) {
      const inicio = new Date(filters.dataInicio);
      const fim = new Date(filters.dataFim);
      
      if (fim < inicio) {
        setValidationError("A data final não pode ser menor que a data inicial.");
        return false;
      }

      // Validar período máximo de 90 dias
      const diffTime = fim - inicio;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 90) {
        setValidationError("O período máximo de consulta é de 90 dias.");
        return false;
      }
    }

    return true;
  };

  // Aplicar filtros
  const handleFilter = () => {
    if (!validateFilters()) {
      return;
    }
    
    setCurrentPage(1);
    loadAcessos(1, filters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      dataInicio: "",
      dataFim: "",
      tipo: "",
      dispositivoId: "",
      status: "",
      areaId: "",
    });
    setValidationError(null);
    setCurrentPage(1);
    loadAcessos(1, {});
  };

  // Alterar valores dos filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationError(null);
  };

  // Mudar página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadAcessos(newPage, filters);
  };

  // Formatar data e hora
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Obter nome do tipo de pessoa
  const getTipoPessoaLabel = (tipo) => {
    const tipos = {
      ALUNO: "Aluno",
      PROFESSOR: "Professor",
      ADMINISTRADOR: "Administrador",
      TERCEIRIZADO: "Terceirizado",
      VISITANTE: "Visitante",
    };
    return tipos[tipo] || tipo || "N/A";
  };

  // Obter classe CSS para status
  const getStatusClass = (permitido) => {
    return permitido ? styles.statusAutorizado : styles.statusNegado;
  };

  // Obter label para status
  const getStatusLabel = (permitido) => {
    return permitido ? "Autorizado" : "Negado";
  };

  // Calcular páginas
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  return (
    <div className={styles.relatoriosContainer}>
      <h1 className={styles.pageTitle}>Relatórios de Acesso</h1>

      {/* Seção de Filtros */}
      <div className={styles.filtersSection}>
        <h2 className={styles.sectionTitle}>Filtros Avançados</h2>
        
        <div className={styles.filtersGrid}>
          {/* Data Início */}
          <div className={styles.filterGroup}>
            <label htmlFor="dataInicio">Data Início:</label>
            <input
              type="date"
              id="dataInicio"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Data Fim */}
          <div className={styles.filterGroup}>
            <label htmlFor="dataFim">Data Fim:</label>
            <input
              type="date"
              id="dataFim"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange("dataFim", e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Tipo de Pessoa */}
          <div className={styles.filterGroup}>
            <label htmlFor="tipo">Tipo de Pessoa:</label>
            <select
              id="tipo"
              value={filters.tipo}
              onChange={(e) => handleFilterChange("tipo", e.target.value)}
              className={styles.select}
            >
              <option value="">Todos</option>
              <option value="ALUNO">Aluno</option>
              <option value="PROFESSOR">Professor</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="TERCEIRIZADO">Terceirizado</option>
              <option value="VISITANTE">Visitante</option>
            </select>
          </div>

          {/* Dispositivo */}
          <div className={styles.filterGroup}>
            <label htmlFor="dispositivo">Dispositivo:</label>
            <select
              id="dispositivo"
              value={filters.dispositivoId}
              onChange={(e) => handleFilterChange("dispositivoId", e.target.value)}
              className={styles.select}
            >
              <option value="">Todos</option>
              {dispositivos.map((disp) => (
                <option key={disp.id} value={disp.id}>
                  {disp.nome || `Dispositivo ${disp.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={styles.filterGroup}>
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={styles.select}
            >
              <option value="">Todos</option>
              <option value="true">Autorizado</option>
              <option value="false">Negado</option>
            </select>
          </div>

          {/* Área */}
          <div className={styles.filterGroup}>
            <label htmlFor="area">Área:</label>
            <select
              id="area"
              value={filters.areaId}
              onChange={(e) => handleFilterChange("areaId", e.target.value)}
              className={styles.select}
            >
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nome || `Área ${area.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensagem de erro de validação */}
        {validationError && (
          <div className={styles.validationError}>
            {validationError}
          </div>
        )}

        {/* Botões de ação */}
        <div className={styles.filterActions}>
          <button 
            onClick={handleFilter} 
            className={styles.btnFilter}
            aria-label="Filtrar registros de acesso"
          >
            Filtrar
          </button>
          <button 
            onClick={handleClearFilters} 
            className={styles.btnClear}
            aria-label="Limpar todos os filtros"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Mensagem de erro da API */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Indicador de total de registros */}
      {!isLoading && !error && acessos.length > 0 && (
        <div className={styles.recordsInfo}>
          Mostrando {startRecord} a {endRecord} de {totalRecords} registros
        </div>
      )}

      {/* Tabela de Dados */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingMessage}>Carregando dados...</div>
        ) : acessos.length === 0 ? (
          <div className={styles.noDataMessage}>
            Nenhum registro encontrado para os filtros aplicados.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Nome da Pessoa</th>
                <th>Tipo</th>
                <th>Dispositivo</th>
                <th>Área</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {acessos.map((acesso) => (
                <tr key={acesso.id}>
                  <td>{formatDateTime(acesso.data_hora)}</td>
                  <td>{acesso.pessoa_nome || "Desconhecido"}</td>
                  <td>{getTipoPessoaLabel(acesso.pessoa_tipo)}</td>
                  <td>{acesso.dispositivo_nome || "N/A"}</td>
                  <td>{acesso.area_nome || "N/A"}</td>
                  <td>
                    <span className={getStatusClass(acesso.permitido)}>
                      {getStatusLabel(acesso.permitido)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {!isLoading && acessos.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.btnPage}
            aria-label="Ir para página anterior"
            aria-disabled={currentPage === 1}
          >
            Anterior
          </button>
          
          <span className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={styles.btnPage}
            aria-label="Ir para próxima página"
            aria-disabled={currentPage >= totalPages}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

export default Relatorios;
