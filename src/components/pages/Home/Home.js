import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSync } from "@fortawesome/free-solid-svg-icons";
import userPlaceholder from "../../../img/user.png";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../services/api";

function Monitoramento() {
  const [accessLogs, setAccessLogs] = useState([]);
  const [latestAccess, setLatestAccess] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
   
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Relógio
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR");
      const time = now.toLocaleTimeString("pt-BR");
      setCurrentDateTime(`${date} ${time}`);
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Função auxiliar para enriquecer os dados
  // AGORA ACEITA A LISTA DE DISPOSITIVOS COMO PARAMETRO
  const enrichAccess = useCallback(async (acesso, listaDispositivos = []) => {
    
    // Lógica para encontrar o nome do dispositivo
    const dispositivoEncontrado = listaDispositivos.find(d => d.id === acesso.dispositivo_id);
    const nomeDispositivo = dispositivoEncontrado ? dispositivoEncontrado.nome : `Dispositivo ID: ${acesso.dispositivo_id}`;

    const baseAccess = {
      ...acesso,
      area: "Portaria Principal", // Você também pode dinamicamente pegar isso se tiver no banco
      dispositivo: nomeDispositivo, // Usa o nome vindo do banco
      autorizacao: acesso.permitido ? "Acesso autorizado" : "Acesso negado",
      status: acesso.permitido ? "authorized" : "denied",
      dataHora: new Date(acesso.data_hora).toLocaleString("pt-BR"),
    };

    if (!acesso.pessoa_id) {
      return {
        ...baseAccess,
        nome: "Visitante/Desconhecido",
        foto: userPlaceholder,
        perfil: "N/A",
      };
    }

    try {
      const [pessoa, fotoData] = await Promise.all([
        api.get(`/pessoas/${acesso.pessoa_id}`),
        api.get(`/pessoas/url/${acesso.pessoa_id}`),
      ]);

      return {
        ...baseAccess,
        nome: pessoa.nome || "Nome não encontrado",
        foto: fotoData.url || userPlaceholder,
        perfil: pessoa.perfil || "Perfil não informado",
      };
    } catch (error) {
      console.error(`Erro ao buscar dados para pessoa_id ${acesso.pessoa_id}:`, error);
      return {
        ...baseAccess,
        nome: "Erro ao carregar dados",
        foto: userPlaceholder,
        perfil: "Erro",
      };
    }
  }, []);

  // Função principal de busca
  const fetchAccesses = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Busca os acessos E os dispositivos em paralelo
      const [acessosResponse, dispositivosResponse] = await Promise.all([
        api.get("/acessos?page=1&limit=100"),
        api.get("/dispositivos")
      ]);

      if (!acessosResponse.data || !Array.isArray(acessosResponse.data)) {
        throw new Error("Formato de resposta inesperado da API de Acessos.");
      }

      const acessosArray = acessosResponse.data;
      const listaDispositivos = dispositivosResponse.data || [];

      // Ordena do mais recente para o mais antigo
      const sortedArray = acessosArray.sort((a, b) => {
        return new Date(b.data_hora) - new Date(a.data_hora);
      });

      // Enriquece os dados passando a lista de dispositivos
      const enrichedAccesses = await Promise.all(
        sortedArray.map((acesso) => enrichAccess(acesso, listaDispositivos))
      );

      if (enrichedAccesses.length > 0) {
        setLatestAccess(enrichedAccesses[0]);
        setAccessLogs(enrichedAccesses.slice(1));
      } else {
        setLatestAccess(null);
        setAccessLogs([]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setError("Falha ao carregar acessos ou dispositivos. Verifique a API.");
    } finally {
      setLoading(false);
    }
  }, [enrichAccess]);

  // Carrega dados iniciais
  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

  // Botão de Sincronizar
  const handleSyncLogs = async () => {
    try {
      setLoading(true); 
      await api.post("/acessos/sincronizar-todos"); 
      await fetchAccesses();
    } catch (error) {
      console.error("Erro na sincronização:", error);
      setError("Erro ao sincronizar logs com o dispositivo.");
      setLoading(false);
    }
  };

  // ... O restante do código de renderização (return) permanece igual ...
  // Renderização condicional do Loader
  if (loading) {
    return (
      <div className={styles.monitoramentoContainer}>
        <h1 className={styles.pageTitle}>Monitoramento</h1>
        <div className={styles.loaderContainer}>
            <FontAwesomeIcon icon={faSync} spin size="3x" color="#021932"/>
            <p>Sincronizando e carregando logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.monitoramentoContainer}>
        <h1 className={styles.pageTitle}>Monitoramento</h1>
        <div style={{ textAlign: 'center' }}>
            <p style={{ color: "red", marginBottom: '20px' }}>{error}</p>
            <button className={styles.syncButton} onClick={fetchAccesses}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.monitoramentoContainer}>
       
      <div className={styles.headerControls}>
        <h1 className={styles.pageTitle}>Monitoramento</h1>
        <button className={styles.syncButton} onClick={handleSyncLogs}>
          <FontAwesomeIcon icon={faSync} /> Receber Logs
        </button>
      </div>

      {latestAccess ? (
        <div className={styles.accessCard}>
          <div className={styles.profileInfo}>
            <div className={styles.profilePicture}>
              <img
                src={latestAccess.foto || userPlaceholder}
                alt="Foto de perfil"
              />
            </div>
            <div className={styles.profileDetails}>
              <p className={styles.dateTime}>
                Data e hora: {latestAccess.dataHora}
              </p>
              <h3>{latestAccess.nome || "Nome não encontrado"}</h3>
              <p>Área: {latestAccess.area}</p>
              {/* O nome do dispositivo aparecerá aqui automaticamente agora */}
              <p>Dispositivo: {latestAccess.dispositivo}</p> 
              <br />
              <p>{latestAccess.autorizacao}</p>
            </div>
          </div>
        </div>
      ) : (
        <p style={{textAlign: 'center', margin: '20px'}}>Nenhum acesso recente encontrado.</p>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.accessTable}>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Data e Hora</th>
              <th>Perfil</th>
              <th>Área</th>
              <th>Dispositivo</th>
              <th>Autorização</th>
            </tr>
          </thead>
          <tbody>
            {accessLogs.slice(0, itemsPerPage).map((log, index) => (
              <tr key={log.id || index}>
                <td>
                  <img
                    src={log.foto || userPlaceholder}
                    alt="Foto"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </td>
                <td>{log.dataHora}</td>
                <td>
                  <p className={styles.profileName}>{log.nome}</p>
                  <p className={styles.profileSubtitle}>{log.perfil}</p>
                </td>
                <td>{log.area}</td>
                {/* Aqui também aparecerá o nome correto */}
                <td>{log.dispositivo}</td> 
                <td>
                  <span
                    className={`${styles.statusBadge} ${styles[log.status]}`}
                  >
                    {log.autorizacao}
                    {log.status === "denied" && (
                      <FontAwesomeIcon
                        icon={faTimes}
                        className={styles.deniedIcon}
                      />
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Monitoramento;