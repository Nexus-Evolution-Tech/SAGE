import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons"; 
import userPlaceholder from "../../../img/user.png";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";

function Monitoramento() {
  const [accessLogs, setAccessLogs] = useState([]);
  const [latestAccess, setLatestAccess] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    
    async function enrichAccess(acesso) {
      const baseAccess = {
        ...acesso,
        area: "Portaria Principal",
        dispositivo: "Catraca Esquerda (IDBlock)",
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

        console.error(
          `Erro ao buscar dados para pessoa_id ${acesso.pessoa_id}:`,
          error
        );
        return {
          ...baseAccess,
          nome: "Erro ao carregar dados",
          foto: userPlaceholder,
          perfil: "Erro",
        };
      }
    }

    // Esta função busca a lista principal de acessos
    async function fetchAccesses() {
      try {
        setError(null);
        setLoading(true);

        // ==========================================================
        // 3. SUBSTITUIR 'FETCH' POR 'API.GET'
        //    (Adicionando paginação como boa prática)
        // ==========================================================
        const acessosResponse = await api.get("/acessos?page=1&limit=20");
        // ==========================================================

        if (!acessosResponse.data || !Array.isArray(acessosResponse.data)) {
          throw new Error("Formato de resposta inesperado da API.");
        }

        const acessosArray = acessosResponse.data;

        // Ordena o array pelos dados originais (mais recente primeiro)
        const sortedArray = acessosArray.sort((a, b) => {
          return new Date(b.data_hora) - new Date(a.data_hora);
        });

        // Executa todas as promessas de "enriquecimento" em paralelo
        const enrichedAccesses = await Promise.all(
          sortedArray.map(enrichAccess)
        );

        if (enrichedAccesses.length > 0) {
          setLatestAccess(enrichedAccesses[0]);
          setAccessLogs(enrichedAccesses.slice(1));
        }
      } catch (error) {
        console.error("Erro ao buscar acessos:", error);
        // O api.js já redireciona se for 401,
        // aqui tratamos outros erros (ex: 500, 404)
        setError("Falha ao carregar acessos. Verifique a API.");
      } finally {
        setLoading(false);
      }
    }

    fetchAccesses();
  }, []); // Dependência vazia, busca apenas uma vez

  // Renderização condicional para Loading e Erro
  if (loading) {
    return (
      <div className={styles.monitoramentoContainer}>
        <h1 className={styles.pageTitle}>Monitoramento</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.monitoramentoContainer}>
        <h1 className={styles.pageTitle}>Monitoramento</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className={styles.monitoramentoContainer}>
      <h1 className={styles.pageTitle}>Monitoramento</h1>
      {/* Exibe o relógio (opcional) */}
      {/* <p>{currentDateTime}</p> */}

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
              <p>Dispositivo: {latestAccess.dispositivo}</p>
              <br />
              <p>{latestAccess.autorizacao}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>Nenhum acesso recente encontrado.</p>
      )}

      {/* Tabela de Logs */}
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
            {accessLogs.slice(0, itemsPerPage).map((log) => (
              <tr key={log.id}>
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